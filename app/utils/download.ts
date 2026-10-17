// download.ts
import { toJpeg, toPng } from 'html-to-image'
import { fontList } from '~/constants'

// 将单个 DOM 元素渲染为 PNG Data URL（截图导出用）
async function renderPageToPng(page: HTMLElement, pixelRatio = 2): Promise<string> {
  return await toPng(page, {
    quality: 1.0,
    pixelRatio,
    skipFonts: false,
    style: { transform: 'none' },
    filter: () => true,
  })
}

// 将单个 DOM 元素渲染为 JPEG Data URL（PDF 导出用，体积小解码快）
async function renderPageToJpeg(page: HTMLElement): Promise<string> {
  return await toJpeg(page, {
    quality: 1.0,
    pixelRatio: 2,
    skipFonts: false,
    style: { transform: 'none' },
    filter: () => true,
  })
}

// 获取分页元素
function getPages(previewRef: HTMLElement | null): HTMLElement[] {
  const wrapper = previewRef?.querySelector('.rs-page-item-wrapper')
  if (!wrapper)
    return []
  return Array.from(wrapper.querySelectorAll('.rs-page-item')) as HTMLElement[]
}

// ---- 下载文件名：优先「一级标题 + 下载时间」，没有一级标题就只用时间 ----
const STAMP_PAD = 2 // 月/日/时/分/秒 都补零到 2 位

function formatStamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(STAMP_PAD, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

// 文件名清洗：去掉文件系统不允许的字符、压掉连续空白、限长（防超长标题）
function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
    .trim()
}

function resolveDownloadName(pages: HTMLElement[], ext?: string): string {
  const heading = pages[0]?.querySelector('h1')?.textContent?.trim() ?? ''
  const stamp = formatStamp()
  const base = sanitizeFileName(heading ? `${heading}-${stamp}` : stamp) || stamp
  return ext ? `${base}.${ext}` : base
}

// 下载文件
function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// 下载 base64 图片
function downloadBase64Image(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}

const MM_TO_INCH_FACTOR = 1 / 25.4 // 毫米转换为英寸的系数
const INCH_TO_PT_FACTOR = 72 // 英寸转换为 Points 的系数
const A4_WIDTH_MM = 210 // A4 纸张宽度 (mm)
const A4_HEIGHT_MM = 297 // A4 纸张高度 (mm)
// 与 app/utils/index.ts、.rs-page-item 一致（96dpi A4）
const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123
// 动态计算 A4 尺寸 (pt)。页高用真实 A4（841.89pt）：
// 页面几何是 A4 比例（794×1123），按宽度换算后页面图高 841.86pt，与 A4 只差 0.03pt，
// 所以图片正好铺满整页，不会在底部留出空白。
const A4_WIDTH_PT = A4_WIDTH_MM * MM_TO_INCH_FACTOR * INCH_TO_PT_FACTOR
const A4_HEIGHT_PT = A4_HEIGHT_MM * MM_TO_INCH_FACTOR * INCH_TO_PT_FACTOR
/**
 * 导出为 PDF
 */
export async function exportToPDF(previewRef: HTMLElement | null, filename?: string) {
  const pages = getPages(previewRef)
  if (!pages.length)
    return
  injectPageBackgrounds(pages)

  try {
    const { jsPDF: JSPDF } = await import('jspdf')
    const pdf = new JSPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [A4_WIDTH_PT, A4_HEIGHT_PT],
      compress: true,
    })

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]!
      const dataUrl = await renderPageToJpeg(page)

      // 图片尺寸用未受预览缩放影响的 offsetWidth/offsetHeight
      const scale = A4_WIDTH_PT / page.offsetWidth
      const imgHeight = page.offsetHeight * scale

      if (i > 0)
        pdf.addPage()
      pdf.addImage(dataUrl, 'JPEG', 0, 0, A4_WIDTH_PT, imgHeight)

      // 计算链接位置并添加可点击区域
      // getBoundingClientRect 含祖先 transform: scale（编辑页预览缩放），分母必须用缩放后的宽度，
      // 否则 scalePre ≠ 1 时链接热区会整体偏移
      const pageRect = page.getBoundingClientRect()
      const rectScale = pageRect.width ? A4_WIDTH_PT / pageRect.width : scale
      const links = page.querySelectorAll('a')

      links.forEach((link) => {
        const rect = link.getBoundingClientRect()
        const x = (rect.left - pageRect.left) * rectScale
        const y = (rect.top - pageRect.top) * rectScale
        const w = rect.width * rectScale
        const h = rect.height * rectScale

        if (link.href) {
          pdf.link(x, y, w, h, { url: link.href })
        }
      })
    }

    pdf.save(filename || resolveDownloadName(pages, 'pdf'))
  }
  finally {
    // 无论成功失败都清理注入的背景节点
    removePageBackgrounds(pages)
  }
}


/**
 * 浏览器「打印为 PDF」：把已分页预览克隆到隐藏 iframe，用系统打印对话框另存。
 * 版式与预览一比一（同一套 .rs-page-item DOM + 主题样式），文字可选。
 * 用户需在打印框中选择「另存为 PDF」，边距选「无」。
 * 始终走隐藏 iframe，不开新标签页。
 */
export async function printToPDF(previewRef: HTMLElement | null) {
  const pages = getPages(previewRef)
  if (!pages.length)
    return

  const title = resolveDownloadName(pages)
  const html = buildPrintDocumentHtml(pages, title, previewRef)
  await printViaIframe(html)
}

function buildPrintDocumentHtml(
  pages: HTMLElement[],
  title: string,
  previewRef: HTMLElement | null,
): string {
  const headAssets = collectPrintHeadAssets()
  const root = document.documentElement
  const rootStyle = root.getAttribute('style') || ''
  const rootClass = root.getAttribute('class') || ''
  const themeName = root.getAttribute('data-resume-theme') || ''
  // 证件照位置写在 .preview-content 的 CSS 变量上，只拷自定义属性，避免带上无关样式
  const previewEl = (previewRef?.closest('.preview-content') as HTMLElement | null)
    ?? document.querySelector('.preview-content') as HTMLElement | null
  const previewVars = collectInlineCssVars(previewEl)

  const pagesHtml = pages.map((page) => {
    const clone = page.cloneNode(true) as HTMLElement
    // 导出用临时背景节点不必进打印稿（::before 已能画背景）
    clone.querySelectorAll('.rs-page-bg').forEach(n => n.remove())
    absolutizeSubtreeUrls(clone)
    return clone.outerHTML
  }).join('\n')

  const themeAttr = themeName
    ? ` data-resume-theme="${escapeHtmlAttr(themeName)}"`
    : ''
  const classAttr = rootClass
    ? ` class="${escapeHtmlAttr(rootClass)}"`
    : ''
  const styleAttr = rootStyle
    ? ` style="${escapeHtmlAttr(rootStyle)}"`
    : ''
  const bodyStyle = previewVars
    ? ` style="${escapeHtmlAttr(previewVars)}"`
    : ''

  return `<!DOCTYPE html>
<html lang="zh-CN"${classAttr}${styleAttr}${themeAttr}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<base href="${escapeHtmlAttr(window.location.href)}" />
<title>${escapeHtmlAttr(title)}</title>
${headAssets}
<style>
${buildPrintFontFaces()}
@page {
  size: A4 portrait;
  margin: 0;
}
html, body {
  margin: 0 !important;
  padding: 0 !important;
  background: #fff !important;
  width: ${A4_WIDTH_PX}px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.print-root {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  width: ${A4_WIDTH_PX}px;
}
.print-root .rs-page-item {
  width: ${A4_WIDTH_PX}px !important;
  max-width: ${A4_WIDTH_PX}px !important;
  min-height: ${A4_HEIGHT_PX}px !important;
  max-height: ${A4_HEIGHT_PX}px !important;
  height: ${A4_HEIGHT_PX}px !important;
  box-shadow: none !important;
  margin: 0 !important;
  overflow: hidden !important;
  page-break-after: always;
  break-after: page;
  break-inside: avoid;
  box-sizing: border-box !important;
}
.print-root .rs-page-item:last-child {
  page-break-after: auto;
  break-after: auto;
}
.print-root .rs-line-split {
  display: none !important;
}
@media print {
  html, body {
    width: ${A4_WIDTH_PX}px;
  }
}
</style>
</head>
<body${bodyStyle}>
<div class="print-root markdown-body rs-page-item-wrapper">${pagesHtml}</div>
</body>
</html>`
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function fontFormatFromUrl(url: string): string {
  const lower = url.toLowerCase()
  if (lower.endsWith('.woff2'))
    return 'woff2'
  if (lower.endsWith('.woff'))
    return 'woff'
  if (lower.endsWith('.otf'))
    return 'opentype'
  return 'truetype'
}

function buildPrintFontFaces(): string {
  return fontList
    .filter(f => f.assets)
    .map((f) => {
      const href = new URL(f.assets!, window.location.origin).href
      return `@font-face{font-family:'${f.value}';src:url('${href}') format('${fontFormatFromUrl(f.assets!)}');font-display:block;}`
    })
    .join('\n')
}

/** 只收集元素 style 上的 CSS 自定义属性（如 --id-photo-top） */
function collectInlineCssVars(el: HTMLElement | null): string {
  if (!el)
    return ''
  const style = el.style
  const parts: string[] = []
  for (let i = 0; i < style.length; i++) {
    const name = style.item(i)
    if (name?.startsWith('--'))
      parts.push(`${name}:${style.getPropertyValue(name)}`)
  }
  return parts.join(';')
}

/** 把子树里的相对 src/href 改成绝对地址，避免 iframe 里解析失败 */
function absolutizeSubtreeUrls(root: HTMLElement) {
  const base = window.location.href
  root.querySelectorAll('[src]').forEach((node) => {
    const el = node as HTMLElement
    const raw = el.getAttribute('src')
    if (!raw || raw.startsWith('data:') || raw.startsWith('blob:') || raw.startsWith('#'))
      return
    try {
      el.setAttribute('src', new URL(raw, base).href)
    }
    catch { /* ignore bad url */ }
  })
  root.querySelectorAll('a[href]').forEach((node) => {
    const el = node as HTMLAnchorElement
    const raw = el.getAttribute('href')
    if (!raw || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('#') || raw.startsWith('javascript:'))
      return
    try {
      el.setAttribute('href', new URL(raw, base).href)
    }
    catch { /* ignore */ }
  })
}

/**
 * 拷贝当前页已加载的样式到打印文档。
 * 主题规则形如 `[data-resume-theme=xxx] .markdown-body …`，必须同时带上 html 上的 data-resume-theme。
 */
function collectPrintHeadAssets(): string {
  const parts: string[] = []
  const seenHrefs = new Set<string>()
  const seenOwnerNodes = new Set<Element>()

  document.querySelectorAll('link[rel="stylesheet"]').forEach((node) => {
    const link = node as HTMLLinkElement
    if (!link.href)
      return
    seenHrefs.add(link.href)
    seenOwnerNodes.add(link)
    parts.push(`<link rel="stylesheet" href="${escapeHtmlAttr(link.href)}">`)
  })

  // Vite / Nuxt 开发态常把 CSS 打进 <style>；用 textContent 避免带上 nonce 等属性
  document.querySelectorAll('style').forEach((node) => {
    seenOwnerNodes.add(node)
    const css = node.textContent || ''
    if (!css.trim())
      return
    parts.push(`<style>${css}</style>`)
  })

  // 兜底：可读但尚未收集的 CSSOM（如 constructable sheets），跳过已处理的 link/style 与跨域
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      const owner = sheet.ownerNode
      if (owner instanceof Element && seenOwnerNodes.has(owner))
        continue
      if (sheet.href && seenHrefs.has(sheet.href))
        continue
      try {
        const rules = Array.from(sheet.cssRules || []).map(r => r.cssText).join('\n')
        if (rules.trim())
          parts.push(`<style>${rules}</style>`)
      }
      catch {
        // 跨域 stylesheet 读不了 cssRules；若已有 link 则仍会加载
      }
    }
  }
  catch {
    /* ignore */
  }

  return parts.join('\n')
}

async function waitForPrintReady(win: Window) {
  const doc = win.document
  // 样式表
  const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[]
  await Promise.all(links.map(link => new Promise<void>((resolve) => {
    if (link.sheet)
      return resolve()
    link.addEventListener('load', () => resolve(), { once: true })
    link.addEventListener('error', () => resolve(), { once: true })
    // 已缓存时可能没有 load 事件
    setTimeout(resolve, 2000)
  })))

  if (doc.fonts)
    await doc.fonts.ready.catch(() => undefined)

  const images = Array.from(doc.images)
  await Promise.all(images.map(img => new Promise<void>((resolve) => {
    if (img.complete)
      return resolve()
    img.addEventListener('load', () => resolve(), { once: true })
    img.addEventListener('error', () => resolve(), { once: true })
  })))

  // 给布局一两帧时间
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  await new Promise(resolve => setTimeout(resolve, 50))
}

async function printViaIframe(html: string) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  // 给足可视尺寸，避免 width:0 时排版崩掉；不可见即可
  iframe.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;border:0;opacity:0;pointer-events:none;z-index:-1'
  document.body.appendChild(iframe)

  const win = iframe.contentWindow
  const doc = iframe.contentDocument
  if (!win || !doc) {
    iframe.remove()
    return
  }

  doc.open()
  doc.write(html)
  doc.close()

  try {
    await waitForPrintReady(win)
    win.focus()
    win.print()
  }
  finally {
    const cleanup = () => {
      try { iframe.remove() } catch { /* ignore */ }
    }
    win.addEventListener('afterprint', cleanup)
    // 部分浏览器不派发 afterprint，超时兜底
    setTimeout(cleanup, 60_000)
  }
}

/**
 * 导出为图片（单页 PNG 或多页 ZIP）
 */
export async function exportToImage(previewRef: HTMLElement | null, baseName?: string) {
  const pages = getPages(previewRef)
  if (!pages.length)
    return
  const base = baseName || resolveDownloadName(pages)
  injectPageBackgrounds(pages)

  try {
    if (pages.length === 1) {
      const dataUrl = await renderPageToPng(pages[0] as HTMLElement)
      downloadBase64Image(dataUrl, `${base}.png`)
      return
    }

    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const dataUrl = await renderPageToPng(page!)
      const base64 = dataUrl.split(',')[1]
      const blob = await fetch(`data:image/png;base64,${base64}`).then(res => res.blob())
      zip.file(`${base}-page-${i + 1}.png`, blob)
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(zipBlob, `${base}-pages.zip`)
  }
  finally {
    // 无论成功失败都清理注入的背景节点（原实现单页导出会漏清理）
    removePageBackgrounds(pages)
  }
}

// 添加背景元素
function injectPageBackgrounds(pages: HTMLElement[]) {
  for (const page of pages) {
    // 如果已有背景就跳过
    if (page.querySelector('.rs-page-bg'))
      continue

    const bg = document.createElement('div')
    bg.className = 'rs-page-bg'
    page.insertBefore(bg, page.firstChild)
  }
}

// 移除背景元素
function removePageBackgrounds(pages: HTMLElement[]) {
  for (const page of pages) {
    const bg = page.querySelector('.rs-page-bg')
    if (bg)
      page.removeChild(bg)
  }
}
