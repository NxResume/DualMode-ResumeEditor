#!/usr/bin/env node
/**
 * 主题封面图生成器（public/assets/themes/<theme>.png）
 *
 * 为什么这么写：封面就是「简历第一页的 2 倍图」——
 * 屏幕页 794×1070 × 2 = 1588×2140，与 app/utils/download.ts 里
 * toPng(page, { pixelRatio: 2 }) 的规格一致。所以这里直接驱动真实页面渲染后截图，
 * 不复制任何渲染逻辑，也不改应用代码。
 *
 * 用法：
 *   pnpm covers                     # 只补缺失的（默认，不覆盖已有图）
 *   pnpm covers --dry-run           # 只列出缺哪些，不生成
 *   pnpm covers --all               # 所有主题（已存在的仍会跳过，除非加 --force）
 *   pnpm covers --theme=techIndigo  # 指定主题（逗号分隔）
 *   pnpm covers --force             # 允许覆盖已有图
 *   APP_URL=http://localhost:3000 pnpm covers   # 复用已启动的 dev server
 *
 * 样本内容固定用 app/constants/templates/tm1.md（新建简历的模板），
 * 并用独立 Chrome profile + 独立 localStorage，绝不读取/写入真实简历数据。
 */
import { Buffer } from 'node:buffer'
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public/assets/themes')
const TEMPLATE = join(ROOT, 'app/constants/templates/tm1.md')
const SAMPLE_ID = '__theme-cover-sample__'
const PROFILE_DIR = join(ROOT, 'node_modules/.cache/theme-cover-profile')
const DEBUG_PORT = Number(process.env.CDP_PORT || 9391)
const PAGE_W = 794
const PAGE_H = 1070
// ---------- 参数 ----------
const argv = process.argv.slice(2)

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function hasFlag(name) {
  return argv.includes(`--${name}`)
}

function argValue(name) {
  const hit = argv.find(a => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : ''
}
const FORCE = hasFlag('force')
const DRY_RUN = hasFlag('dry-run')
const ALL = hasFlag('all')
const ONLY = argValue('theme').split(',').map(s => s.trim()).filter(Boolean)

// ---------- 主题清单：与 UI 同源（reTheme.getThemeList） ----------
function themeList() {
  try {
    const require = createRequire(join(ROOT, 'package.json'))
    const mod = require('resume-theme')
    const list = mod?.getThemeList?.() ?? mod?.reTheme?.getThemeList?.()
    if (Array.isArray(list) && list.length)
      return list
  }
  catch (error) {
    console.warn(`[warn] 读 resume-theme 的 getThemeList 失败，回退到扫包目录：${error.message}`)
  }
  const dir = join(ROOT, 'node_modules/resume-theme/dist/themes')
  return readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort()
}

// ---------- dev server：没有就自己起，起完自己收 ----------
async function ping(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    return res.ok
  }
  catch {
    return false
  }
}

async function ensureServer() {
  const preset = process.env.APP_URL
  if (preset && await ping(preset))
    return { url: preset.replace(/\/$/, ''), child: null }
  if (!preset && await ping('http://localhost:3000'))
    return { url: 'http://localhost:3000', child: null }

  console.log('→ 没有可用的 dev server，启动一个（用完会自动关掉）')
  // detached: true → 自成进程组，收尾时能连孙进程（nuxt）一起杀干净
  const child = spawn('pnpm', ['dev'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], detached: true })
  let buf = ''
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('dev server 60s 内没起来')), 60000)
    const onData = (chunk) => {
      buf += chunk.toString()
      const hit = /Local:\s+(http:\/\/\S+)/.exec(buf)
      if (hit) {
        clearTimeout(timer)
        resolve(hit[1].replace(/\/$/, ''))
      }
    }
    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
    child.on('exit', (code) => {
      clearTimeout(timer)
      reject(new Error(`dev server 退出（code=${code}）`))
    })
  })
  for (let i = 0; i < 30; i++) {
    if (await ping(url))
      return { url, child }
    await sleep(1000)
  }
  throw new Error(`dev server 起来了但访问不通：${url}`)
}

// ---------- Chrome / CDP ----------
function chromeBinary() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean)
  const found = candidates.find(p => existsSync(p))
  if (!found)
    throw new Error('找不到 Chrome，请用 CHROME_PATH 指定可执行文件')
  return found
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl)
  let seq = 0
  const pending = new Map()
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m)
      pending.delete(m.id)
    }
  })
  const ready = new Promise((res, rej) => {
    ws.addEventListener('open', res)
    ws.addEventListener('error', rej)
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq
    pending.set(id, resolve)
    ws.send(JSON.stringify({ id, method, params }))
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id)
        reject(new Error(`CDP 超时：${method}`))
      }
    }, 120000)
  })
  return { ws, ready, send }
}

// 杀掉整棵进程树（detached 起的子进程自成进程组，-pid 能连孙进程一起收）
function killTree(child) {
  if (!child)
    return
  try {
    process.kill(-child.pid, 'SIGTERM')
  }
  catch {
    try {
      child.kill()
    }
    catch {}
  }
}

async function launchChrome() {
  mkdirSync(PROFILE_DIR, { recursive: true })
  const child = spawn(chromeBinary(), [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${PROFILE_DIR}`,
    'about:blank',
  ], { stdio: 'ignore', detached: true })

  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json()
      const page = list.find(t => t.type === 'page')
      if (page?.webSocketDebuggerUrl)
        return { child, url: page.webSocketDebuggerUrl }
    }
    catch {}
    await sleep(500)
  }
  killTree(child)
  throw new Error('Chrome 调试端口没通')
}

// ---------- 单个主题取图 ----------
async function captureTheme(c, appUrl, theme, template) {
  const evaluate = async (expr) => {
    const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
    if (r.result?.exceptionDetails)
      throw new Error(String(r.result.exceptionDetails.exception?.description).slice(0, 200))
    return r.result?.result?.value
  }

  // 每次都用干净的样本数据（独立 profile，碰不到真实简历）
  await c.send('Page.navigate', { url: appUrl })
  await sleep(1500)
  await evaluate(`(() => {
    localStorage.setItem('nuxt-resume-editor-storage-mode', 'local')
    localStorage.setItem('nuxt-resume-editor-resumes', JSON.stringify([{
      id: ${JSON.stringify(SAMPLE_ID)},
      name: 'theme-cover-sample',
      theme: ${JSON.stringify(theme)},
      plugins: [],
      isDefault: false,
      content: ${JSON.stringify(template)},
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    }]))
    localStorage.setItem('nuxt-resume-editor-settings-open', 'false')
    localStorage.removeItem('nuxt-resume-editor-autosave')
    return 1
  })()`)

  await c.send('Page.navigate', { url: `${appUrl}/edit/${SAMPLE_ID}` })
  let appeared = false
  for (let i = 0; i < 45; i++) {
    if (await evaluate('!!document.querySelector(".rs-page-item")')) {
      appeared = true
      break
    }
    await sleep(1000)
  }
  if (!appeared)
    throw new Error('预览没有渲染出 .rs-page-item')

  // 100% 缩放（1 CSS px = 1 页面 px）+ 切主题
  await evaluate(`(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '100%')
    if (btn) btn.click()
    document.documentElement.setAttribute('data-resume-theme', ${JSON.stringify(theme)})
    return 1
  })()`)

  // 等字体就绪 + 等分页稳定（分页是防抖异步重排，不等会截到半成品）
  await evaluate('document.fonts.ready.then(() => 1)')
  let last = -1
  let stable = 0
  for (let i = 0; i < 40; i++) {
    const count = await evaluate('document.querySelectorAll(".rs-page-item").length')
    stable = count === last ? stable + 1 : 0
    last = count
    if (stable >= 3 && i > 3)
      break
    await sleep(700)
  }
  // 等证件照/图片加载完（tm1.md 里有 #id-photo）
  for (let i = 0; i < 30; i++) {
    const pending = await evaluate(`[...document.querySelectorAll('.rs-page-item img')].filter(img => !img.complete || !img.naturalWidth).length`)
    if (!pending)
      break
    await sleep(500)
  }

  const geo = await evaluate(`(() => {
    const page = document.querySelector('.rs-page-item')
    const r = page.getBoundingClientRect()
    return { pages: document.querySelectorAll('.rs-page-item').length, w: Math.round(r.width), h: Math.round(r.height), x: r.x, y: r.y, transform: getComputedStyle(page).transform }
  })()`)
  if (geo.w !== PAGE_W || geo.h !== PAGE_H)
    throw new Error(`第一页尺寸异常：${geo.w}×${geo.h}（期望 ${PAGE_W}×${PAGE_H}，缩放或几何变了）`)

  const shot = await c.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: geo.x, y: geo.y, width: geo.w, height: geo.h, scale: 2 },
  })
  return { base64: shot.result.data, pages: geo.pages }
}

// ---------- 主流程 ----------
const allThemes = themeList()
const themes = ONLY.length ? allThemes.filter(t => ONLY.includes(t)) : allThemes
if (ONLY.length && themes.length !== ONLY.length) {
  const missing = ONLY.filter(t => !allThemes.includes(t))
  throw new Error(`主题不存在：${missing.join(', ')}（可用：${allThemes.join(', ')}）`)
}

const target = []
const skipped = []
for (const theme of themes) {
  const file = join(OUT_DIR, `${theme}.png`)
  const exists = existsSync(file)
  if (exists && !ALL && !ONLY.length)
    skipped.push({ theme, reason: '只补缺失' })
  else if (exists && !FORCE)
    skipped.push({ theme, reason: '已存在（加 --force 覆盖）' })
  else
    target.push({ theme, file })
}

console.log(`主题清单（${allThemes.length} 个）：${allThemes.join(', ')}`)
if (skipped.length)
  console.log(`跳过 ${skipped.length} 个：${skipped.map(s => `${s.theme}（${s.reason}）`).join('、')}`)
console.log(`本次要生成 ${target.length} 个：${target.map(t => t.theme).join(', ') || '(无)'}`)

if (!target.length) {
  console.log('✓ 没有需要生成的封面')
  process.exit(0)
}
if (DRY_RUN) {
  console.log('（--dry-run：不生成文件）')
  process.exit(0)
}

mkdirSync(OUT_DIR, { recursive: true })
const template = readFileSync(TEMPLATE, 'utf8')
const server = await ensureServer()
console.log(`→ dev server: ${server.url}`)
const chrome = await launchChrome()
const c = connect(chrome.url)
await c.ready
await c.send('Runtime.enable')
await c.send('Page.enable')
// 视口给足高度，保证第一页 1070px 完整在视口内（不影响页面自身几何）
await c.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1500, deviceScaleFactor: 1, mobile: false })

const results = []
process.on('exit', () => {
  killTree(chrome.child)
  killTree(server.child)
})

for (const { theme, file } of target) {
  const t0 = Date.now()
  try {
    const { base64, pages } = await captureTheme(c, server.url, theme, template)
    writeFileSync(file, Buffer.from(base64, 'base64'))
    const size = statSync(file).size
    const [w, h] = sipsSize(file)
    results.push({ theme, ok: true, w, h, kb: Math.round(size / 1024), pages, ms: Date.now() - t0 })
    console.log(`✓ ${theme}  ${w}×${h}  ${Math.round(size / 1024)}KB  样本共 ${pages} 页  ${Date.now() - t0}ms`)
  }
  catch (error) {
    results.push({ theme, ok: false, error: error.message })
    console.error(`✗ ${theme}  失败：${error.message}`)
  }
}

c.ws.close()
killTree(chrome.child)
killTree(server.child)

console.log('\n主题            结果   尺寸           体积')
for (const r of results) {
  const status = r.ok ? '✓' : '✗'
  const dim = r.ok ? `${r.w}×${r.h}` : (r.error || '').slice(0, 40)
  console.log(`${r.theme.padEnd(16)}${status}    ${dim.padEnd(14)} ${r.ok ? `${r.kb}KB` : ''}`)
}
const failed = results.filter(r => !r.ok)
console.log(`\n完成：成功 ${results.length - failed.length} / 失败 ${failed.length}`)
process.exit(failed.length ? 1 : 0)

function sipsSize(file) {
  try {
    const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' })
    return [+/pixelWidth: (\d+)/.exec(out)[1], +/pixelHeight: (\d+)/.exec(out)[1]]
  }
  catch {
    return [0, 0]
  }
}
