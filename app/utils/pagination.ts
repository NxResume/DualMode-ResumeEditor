import { A4_HEIGHT_PX } from '~/utils'

// 分页配置接口
export interface PaginationConfig {
  pageHeight: number
  padding: number
  noSplitTags: string[]
  themeClass: string
  themeName: string
  truncateToOnePage?: boolean
}

// 默认配置
export const DEFAULT_CONFIG: PaginationConfig = {
  pageHeight: A4_HEIGHT_PX,
  padding: 36,
  noSplitTags: ['img', 'table', 'pre', 'code'],
  themeClass: 'markdown-body',
  themeName: 'default',
}

// 特殊主题列表（首页无顶部 padding）
// 与 resume-theme 包中 `[data-resume-theme=…] .markdown-body .rs-page-item` 的规则保持一致
const SPECIAL_THEMES: string[] = [
  'blueSimplicity',
  'blackToppedSimple',
]

/** 超高且不可拆分元素被独立放一页时打上的标记 */
export const OVERFLOW_ITEM_CLASS = 'rs-item-overflow'
/** 含溢出元素的页面上的 data 属性（值为溢出元素个数） */
export const OVERFLOW_ATTR = 'data-overflow-count'

/** 读取元素的 margin（非像素值按 0 处理） */
function cssMargin(element: HTMLElement, side: 'marginTop' | 'marginBottom'): number {
  const value = Number.parseFloat(window.getComputedStyle(element)[side])
  return Number.isNaN(value) ? 0 : value
}

/** 绝对/固定定位元素不参与文档流（如 #id-photo），不占高度 */
function isOutOfFlow(element: HTMLElement): boolean {
  const position = window.getComputedStyle(element).position
  return position === 'absolute' || position === 'fixed'
}

/** 元素自身占据高度（offsetHeight 已含 padding/border，另加 margin） */
export function getElementHeight(element: HTMLElement): number {
  if (isOutOfFlow(element))
    return 0
  return element.offsetHeight + cssMargin(element, 'marginTop') + cssMargin(element, 'marginBottom')
}

export function canSplitElement(element: HTMLElement, config: PaginationConfig): boolean {
  return !config.noSplitTags.includes(element.tagName.toLowerCase())
}

/** 测量哨兵：零高度的块级元素，标出内容真实的上下边界 */
const SENTINEL_ATTR = 'data-pg-sentinel'

function createSentinel(): HTMLElement {
  const sentinel = document.createElement('div')
  sentinel.setAttribute(SENTINEL_ATTR, '')
  sentinel.style.cssText = 'height:0;margin:0;padding:0;border:0'
  return sentinel
}

/**
 * 该元素能否用自己的盒子量高度。
 * `<br>`（markdown 里的空行）、裸 `<span>` 这类行内元素在 Chrome 里 offsetTop / offsetHeight
 * 全都是 0，但它们的行盒是真实占位的 —— 必须由相邻块级元素的推进量吸收，
 * 否则空行前面的段落会被算成负高度、空行本身被算成后面元素的绝对位置（页数会暴涨）。
 */
function isMeasurable(element: HTMLElement): boolean {
  return !isOutOfFlow(element) && window.getComputedStyle(element).display !== 'inline'
}

/**
 * 一次性量出每个元素的「推进高度」= 自身顶边到下一个可量元素顶边的距离。
 * 首尾各插一个零高度哨兵，于是：
 * - 行内元素的空行（`<br>`）被相邻块级元素的推进量吸收；
 * - 末尾的行盒与 margin 也算得进来（不再用「最后一个只取 offsetHeight」的近似）；
 * - margin 折叠只算一次（浏览器怎么排就怎么算）。
 * 前提：所有元素都挂在**同一个真实页面容器**里（autoPaginate 的测量阶段保证这一点）。
 */
function measureFlowHeights(start: HTMLElement, elements: HTMLElement[], end: HTMLElement): number[] {
  const measurable = elements.filter(isMeasurable)
  const heights: number[] = elements.map(() => 0)
  const startTop = start.offsetTop

  // 推进量 = 「下一个可量元素顶边」−「本元素顶边」：
  // 元素自身高度 + 它后面的间距都在里面（夹在中间的行内空行因其顶边被推后而自动算入）。
  // 第一个元素改用起始哨兵顶边当基准（把它上方的空间也算进来），
  // 最后一个元素用结束哨兵收尾（末尾的行盒与 margin 不再被漏掉）。
  // 于是所有推进量之和 = 结束哨兵顶边 − 起始哨兵顶边 = 内容真实总高。
  for (let i = 0; i < measurable.length; i++) {
    const element = measurable[i]!
    const nextTop = i + 1 < measurable.length ? measurable[i + 1]!.offsetTop : end.offsetTop
    const ownTop = i === 0 ? startTop : element.offsetTop
    heights[elements.indexOf(element)] = nextTop - ownTop
  }

  return heights
}

function createNewPage(): HTMLElement {
  const page = document.createElement('div')
  page.className = 'rs-page-item'
  return page
}

function createPageSplit(): HTMLElement {
  const split = document.createElement('div')
  split.className = 'rs-line-split'
  return split
}

/** 单页可用内容高度（特殊主题首页少一个顶部 padding） */
function maxContentHeight(config: PaginationConfig, isSpecialTheme: boolean, pageIndex: number): number {
  return isSpecialTheme && pageIndex === 1
    ? config.pageHeight - config.padding
    : config.pageHeight - config.padding * 2
}

// ── 分页状态 ──

interface PageState {
  page: HTMLElement
  index: number
  height: number
}

function startNewPage(wrapper: HTMLElement, prev: PageState): PageState {
  wrapper.appendChild(createPageSplit())
  const page = createNewPage()
  wrapper.appendChild(page)
  return { page, index: prev.index + 1, height: 0 }
}

/** 标记「内容超出单页」的页与元素，避免静默裁切无从发现 */
function markOverflow(page: HTMLElement, element: HTMLElement, height: number, maxHeight: number) {
  element.classList.add(OVERFLOW_ITEM_CLASS)
  element.setAttribute('data-overflow-height', String(Math.round(height)))
  const count = Number(page.getAttribute(OVERFLOW_ATTR) || 0) + 1
  page.setAttribute(OVERFLOW_ATTR, String(count))
  console.warn(
    `[pagination] <${element.tagName.toLowerCase()}> 高 ${Math.round(height)}px 超过单页可用高度 ${Math.round(maxHeight)}px，已独占一页，超出部分会被裁切`,
    element,
  )
}

// ── 列表分页 ──

/** 复制列表壳（标签 + class，与旧实现一致） */
function createListShell(source: HTMLElement): HTMLElement {
  const list = document.createElement(source.tagName)
  list.className = source.className
  return list
}

/** 列表中每个子项的高度与列表壳自身的上下 margin，都在测量阶段（元素仍挂在文档里）读好 */
interface ListMetrics {
  itemHeights: number[]
  shellMargin: number
}

/**
 * 列表分页：按可用高度逐页切分，超长列表可跨任意页数（旧实现只拆一次，最多两页）。
 * 每一块都新建列表壳，因此每块各自承担一次列表壳的上下 margin。
 *
 * 注意：本函数运行时 element 已经**脱离文档**（装配阶段会先清空测量页），
 * 此时 offsetHeight/getComputedStyle 都取不到有效值，所以高度必须由 metrics 传入。
 */
function handleListPagination(
  element: HTMLElement,
  state: PageState,
  wrapper: HTMLElement,
  config: PaginationConfig,
  isSpecialTheme: boolean,
  metrics: ListMetrics,
): PageState {
  const items = Array.from(element.children) as HTMLElement[]
  const itemHeights = metrics.itemHeights
  const shellMargin = metrics.shellMargin

  let current = state
  let cursor = 0

  while (cursor < items.length) {
    const budget = maxContentHeight(config, isSpecialTheme, current.index) - current.height - shellMargin
    const chunk: HTMLElement[] = []
    let chunkHeight = 0

    while (cursor < items.length && chunkHeight + itemHeights[cursor]! <= budget) {
      chunkHeight += itemHeights[cursor]!
      chunk.push(items[cursor]!)
      cursor++
    }

    if (chunk.length === 0) {
      // 单项就超过整页可用高度
      if (current.height > 0) {
        // 先换页再试（本页已装下的内容保留）
        current = startNewPage(wrapper, current)
        continue
      }
      // 独占一页并标记溢出；cursor 必然前进，不会死循环
      const item = items[cursor]!
      const list = createListShell(element)
      list.appendChild(item)
      current.page.appendChild(list)
      current.height = itemHeights[cursor]! + shellMargin
      markOverflow(current.page, item, current.height, maxContentHeight(config, isSpecialTheme, current.index))
      cursor++
      if (cursor < items.length)
        current = startNewPage(wrapper, current)
      continue
    }

    const list = createListShell(element)
    for (const node of chunk)
      list.appendChild(node)
    current.page.appendChild(list)
    current.height += chunkHeight + shellMargin

    if (cursor < items.length)
      current = startNewPage(wrapper, current)
  }

  return current
}

// ── 自动分页 ──

export function autoPaginate(
  wrapper: HTMLElement,
  content: string,
  customConfig?: Partial<PaginationConfig>,
) {
  const config = { ...DEFAULT_CONFIG, ...customConfig }
  const isSpecialTheme = SPECIAL_THEMES.includes(config.themeName)

  // 清空现有内容
  wrapper.innerHTML = ''

  // 阶段 1：把内容挂进一个**真实页面**做测量。
  // 它自带 .rs-page-item 的 padding/宽度，又处在 wrapper 的 markdown-body 与
  // html[data-resume-theme] 上下文中，所以量到的宽度、折行与主题规则和最终渲染完全一致。
  // （旧实现用 794px 无 padding 的 .temp-container 测，内容宽 794 而实际是 722，高度系统性偏小）
  const measurementPage = createNewPage()
  measurementPage.style.visibility = 'hidden' // 参与布局但不显示，避免测量期间闪烁
  wrapper.appendChild(measurementPage)
  measurementPage.innerHTML = content

  // 首尾哨兵：给出内容真实的上下边界。末尾的行盒/外边距、以及行内空行（<br>）
  // 都靠它们被算进来 —— 少了这两个，空行会算成负高度或让页数暴涨。
  const startSentinel = createSentinel()
  const endSentinel = createSentinel()
  measurementPage.prepend(startSentinel)
  measurementPage.appendChild(endSentinel)

  try {
    const elements = (Array.from(measurementPage.children) as HTMLElement[]).filter(
      element => !element.hasAttribute(SENTINEL_ATTR),
    )

    // 阶段 2：一次性预读高度，装配循环内不再触发同步 layout
    // 列表子项也要在这里量：装配阶段会先清空测量页，节点脱离文档后 offsetHeight 全为 0
    const elementHeights = measureFlowHeights(startSentinel, elements, endSentinel)
    const listMetrics = new Map<HTMLElement, ListMetrics>()
    for (const element of elements) {
      const tag = element.tagName.toLowerCase()
      if (tag !== 'ul' && tag !== 'ol')
        continue
      listMetrics.set(element, {
        itemHeights: (Array.from(element.children) as HTMLElement[]).map(getElementHeight),
        shellMargin: cssMargin(element, 'marginTop') + cssMargin(element, 'marginBottom'),
      })
    }

    // 哨兵已完成使命，移除后再装配（它们不能出现在输出里）
    startSentinel.remove()
    endSentinel.remove()

    // 阶段 3：清空后逐页装配（节点引用仍然有效）
    measurementPage.innerHTML = ''
    const firstPage = measurementPage
    if (isSpecialTheme)
      firstPage.style.paddingTop = '0px'

    let state: PageState = { page: firstPage, index: 1, height: 0 }

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]!
      const height = elementHeights[i]!
      const maxHeight = maxContentHeight(config, isSpecialTheme, state.index)

      if (height > maxHeight) {
        const tag = element.tagName.toLowerCase()
        if (canSplitElement(element, config) && (tag === 'ul' || tag === 'ol')) {
          state = handleListPagination(element, state, wrapper, config, isSpecialTheme, listMetrics.get(element) ?? {
            itemHeights: [],
            shellMargin: 0,
          })
          continue
        }
        // 不可拆分且超过整页：独占一页；当前页为空时不再另开一页（旧实现会留下空白首页）
        if (state.height > 0)
          state = startNewPage(wrapper, state)
        state.page.appendChild(element)
        state.height = height
        markOverflow(state.page, element, height, maxContentHeight(config, isSpecialTheme, state.index))
      }
      else {
        // 当前页剩余空间不够 → 换页
        if (state.height + height > maxHeight)
          state = startNewPage(wrapper, state)
        state.page.appendChild(element)
        state.height += height
      }
    }

    // 截断到仅第一页（仅当实际超过一页时才截断）
    if (config.truncateToOnePage && state.index > 1) {
      // 序列化前先恢复可见性，否则 outerHTML 会把 visibility:hidden 一起带出去
      firstPage.style.visibility = ''
      wrapper.innerHTML = (wrapper.firstChild as HTMLElement).outerHTML
    }
  }
  catch (error) {
    console.error('Error during pagination:', error)
    wrapper.innerHTML = content
  }
  finally {
    // 无论成功失败都恢复可见
    measurementPage.style.visibility = ''
  }
}
