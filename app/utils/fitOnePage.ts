import { A4_HEIGHT_PX } from '~/utils'
import { createNewPage, createSentinel, SENTINEL_ATTR } from '~/utils/pagination'

/** 行高下限：再低行距就贴在一起，可读性明显下降 */
export const FIT_MIN_LINE_HEIGHT = 1.5
/** 字号缩放下限：14px 正文 → 10.5px（约 8pt），打印可读的底线 */
export const FIT_MIN_FONT_SCALE = 0.75
/** 行高 / 字号二分搜索精度 */
const SEARCH_PRECISION = 0.01

export interface FitOnePageConfig {
  /** 用户设置的行高：适配只往下探，不会高于它 */
  lineHeight: number
}

export interface FitOnePageResult {
  /** 压到两个下限后是否真的放进了一页 */
  fits: boolean
  /** 实际采用的行高（= 用户值或更低） */
  lineHeight: number
  /** 字号缩放比例，1 表示未缩 */
  fontScale: number
  /** 处理后的 HTML：fontScale < 1 时各元素带内联 font-size，否则与输入一致 */
  content: string
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * 行高覆盖同时写两处：`line-height` 管文本行盒，`--resume-line-height` 管 .md-gap 这类按变量取值的间距。
 * 写在 wrapper 上供分页测量与渲染继承；再逐页内联一份，是因为打印导出只克隆 .rs-page-item 节点。
 */
export function applyLineHeightOverride(el: HTMLElement, lineHeight: number) {
  el.style.lineHeight = String(lineHeight)
  el.style.setProperty('--resume-line-height', String(lineHeight))
}

export function clearLineHeightOverride(el: HTMLElement) {
  el.style.removeProperty('line-height')
  el.style.removeProperty('--resume-line-height')
}

/**
 * 在 [lo, hi] 上二分找最大的仍放得下的值（行高与字号共用）。
 * 前提：lo 放得下、hi 放不下；返回值已按精度取整。
 */
function searchMax(lo: number, hi: number, fitsAt: (value: number) => boolean): number {
  while (hi - lo > SEARCH_PRECISION) {
    const mid = round2((lo + hi) / 2)
    if (mid <= lo || mid >= hi)
      break
    if (fitsAt(mid))
      lo = mid
    else
      hi = mid
  }
  return lo
}

/**
 * 单页可用内容高度：按测量页的**实际**上下 padding 算，而不是 2 × 设置值 ——
 * 通栏主题（blueSimplicity 等）首页 padding-top 为 0，这里自动跟上，与 autoPaginate 的预算一致。
 */
function availableHeight(page: HTMLElement): number {
  const style = window.getComputedStyle(page)
  const top = Number.parseFloat(style.paddingTop) || 0
  const bottom = Number.parseFloat(style.paddingBottom) || 0
  return A4_HEIGHT_PX - top - bottom
}

/** 内容真实总高 = 结束哨兵顶边 − 起始哨兵顶边（与 pagination 的 measureFlowHeights 同一口径） */
function contentHeight(start: HTMLElement, end: HTMLElement): number {
  return end.offsetTop - start.offsetTop
}

interface ScalableNode {
  el: HTMLElement
  fontSize: number
  /** 按 px 定宽高的图标与字号同比例缩，否则会显得比旁边的文字大一截 */
  box?: { width: number, height: number }
}

/** 一次性读好每个元素的基准字号（之后每次探测只写内联样式，不再读计算样式） */
function collectScalable(page: HTMLElement): ScalableNode[] {
  const nodes: ScalableNode[] = []
  for (const el of Array.from(page.querySelectorAll<HTMLElement>('*'))) {
    if (el.hasAttribute(SENTINEL_ATTR))
      continue
    const style = window.getComputedStyle(el)
    const fontSize = Number.parseFloat(style.fontSize)
    if (!Number.isFinite(fontSize) || fontSize <= 0)
      continue
    const node: ScalableNode = { el, fontSize }
    if (el.classList.contains('md-icon-svg')) {
      node.box = {
        width: Number.parseFloat(style.width) || 0,
        height: Number.parseFloat(style.height) || 0,
      }
    }
    nodes.push(node)
  }
  return nodes
}

function applyFontScale(nodes: ScalableNode[], scale: number) {
  for (const { el, fontSize, box } of nodes) {
    el.style.fontSize = `${round2(fontSize * scale)}px`
    if (box) {
      el.style.width = `${round2(box.width * scale)}px`
      el.style.height = `${round2(box.height * scale)}px`
    }
  }
}

/**
 * 智能一页：先降行高、再等比缩字号，找到能把整份内容放进一页 A4 的最温和的一组参数 ——
 * 行高与字号都取「仍放得下的最大值」（二分，精度 0.01），不会多压一分。
 *
 * 为什么是内联字号而不是 transform / zoom：主题把各级标题字号写死在 px 里（改 --font-size 没用）；
 * transform 要加宽内容盒，会撞上通栏主题 `.rs-page-item > p` 这类直接子选择器；
 * 内联 font-size 不改任何盒子尺寸，导出（截图 / 打印克隆）与跟随滚动都不用知道它的存在。
 *
 * 返回时 wrapper 上已带最终行高的内联覆盖（供随后的 autoPaginate 在同一几何下测量与装页），
 * 测量用的临时页面已移除。
 */
export function fitOnePage(
  wrapper: HTMLElement,
  content: string,
  config: FitOnePageConfig,
): FitOnePageResult {
  const userLineHeight = Number.isFinite(config.lineHeight) && config.lineHeight > 0
    ? config.lineHeight
    : 1.9

  // 与 autoPaginate 同样挂进真实页面测量：作为 wrapper 首个子元素，通栏主题的首页规则才会命中
  wrapper.innerHTML = ''
  const page = createNewPage()
  page.style.visibility = 'hidden'
  wrapper.appendChild(page)
  page.innerHTML = content
  const start = createSentinel()
  const end = createSentinel()
  page.prepend(start)
  page.appendChild(end)

  const limit = availableHeight(page)
  const fitsNow = () => contentHeight(start, end) <= limit
  const fitsAtLineHeight = (lineHeight: number) => {
    applyLineHeightOverride(wrapper, lineHeight)
    return fitsNow()
  }

  const finish = (lineHeight: number, fontScale: number, fits: boolean): FitOnePageResult => {
    start.remove()
    end.remove()
    return {
      fits,
      lineHeight,
      fontScale,
      content: fontScale < 1 ? page.innerHTML : content,
    }
  }

  try {
    // 阶段 1：只收紧行距，字号不动
    if (fitsAtLineHeight(userLineHeight))
      return finish(userLineHeight, 1, true)
    let lineHeight = userLineHeight
    if (userLineHeight > FIT_MIN_LINE_HEIGHT) {
      if (fitsAtLineHeight(FIT_MIN_LINE_HEIGHT)) {
        lineHeight = searchMax(FIT_MIN_LINE_HEIGHT, userLineHeight, fitsAtLineHeight)
        applyLineHeightOverride(wrapper, lineHeight)
        return finish(lineHeight, 1, true)
      }
      lineHeight = FIT_MIN_LINE_HEIGHT
    }

    // 阶段 2：行高已到底（或用户值本就不高于下限），再等比缩字号
    const nodes = collectScalable(page)
    const fitsAtScale = (scale: number) => {
      applyFontScale(nodes, scale)
      return fitsNow()
    }
    if (!fitsAtScale(FIT_MIN_FONT_SCALE))
      return finish(lineHeight, FIT_MIN_FONT_SCALE, false)
    const fontScale = searchMax(FIT_MIN_FONT_SCALE, 1, fitsAtScale)
    // 二分最后一次探测的不一定是最终值，按结果重新写一遍
    applyFontScale(nodes, fontScale)
    return finish(lineHeight, fontScale, true)
  }
  finally {
    page.remove()
  }
}
