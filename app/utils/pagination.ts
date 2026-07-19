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
  pageHeight: 1070,
  padding: 36,
  noSplitTags: ['img', 'table', 'pre', 'code'],
  themeClass: 'prose',
  themeName: 'default',
}

// 特殊主题列表（首页无顶部 padding）
const SPECIAL_THEMES: string[] = [
  'blueSimplicity',
  'blackToppedSimple',
]

/** 获取元素实际占据高度（margin 累加，不含 padding — offsetHeight 已含 padding） */
export function getElementHeight(element: HTMLElement): number {
  if (element.tagName.toLowerCase() === 'img' && element.id === 'id-photo') {
    return 0
  }
  const style = window.getComputedStyle(element)
  const marginTop = Number.parseFloat(style.marginTop)
  const marginBottom = Number.parseFloat(style.marginBottom)
  return element.offsetHeight + marginTop + marginBottom
}

export function canSplitElement(element: HTMLElement, config: PaginationConfig): boolean {
  return !config.noSplitTags.includes(element.tagName.toLowerCase())
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

// ── 列表分页 ──

function handleListPagination(
  element: HTMLElement,
  state: PageState,
  wrapper: HTMLElement,
  maxPageHeight: number,
): PageState {
  const items = Array.from(element.children) as HTMLElement[]

  // 预读所有子元素高度，避免逐元素 getComputedStyle 触发 layout thrashing
  const itemHeights = items.map(getElementHeight)

  let tempHeight = state.height
  let splitAt = items.length // 默认全放进当前页

  for (let i = 0; i < items.length; i++) {
    if (tempHeight + itemHeights[i]! > maxPageHeight) {
      splitAt = i
      break
    }
    tempHeight += itemHeights[i]!
  }

  // 当前页的列表项
  if (splitAt > 0) {
    const newList = document.createElement(element.tagName)
    newList.className = element.className
    for (let i = 0; i < splitAt; i++) {
      newList.appendChild(items[i]!)
    }
    state.page.appendChild(newList)
  }

  // 溢出项放到新页
  if (splitAt < items.length) {
    const nextState = startNewPage(wrapper, state)
    const remainingList = document.createElement(element.tagName)
    remainingList.className = element.className
    for (let i = splitAt; i < items.length; i++) {
      remainingList.appendChild(items[i]!)
    }
    nextState.page.appendChild(remainingList)
    nextState.height = getElementHeight(remainingList)
    return nextState
  }

  state.height = tempHeight
  return state
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

  // 创建临时容器用于高度测量（不触发页面 reflow）
  const tempContainer = document.createElement('div')
  tempContainer.className = `temp-container ${config.themeClass}`
  tempContainer.innerHTML = content
  document.body.appendChild(tempContainer)

  try {
    const elements = Array.from(tempContainer.children) as HTMLElement[]

    // 预读所有元素高度，避免循环内 getComputedStyle 强制 reflow
    const elementHeights = elements.map(getElementHeight)

    // 首页
    const firstPage = createNewPage()
    wrapper.appendChild(firstPage)
    if (isSpecialTheme) {
      firstPage.style.paddingTop = '0px'
    }
    let state: PageState = { page: firstPage, index: 1, height: 0 }

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]!
      const elementHeight = elementHeights[i]!

      const maxPageHeight = isSpecialTheme && state.index === 1
        ? config.pageHeight - config.padding
        : config.pageHeight - config.padding * 2

      if (elementHeight > maxPageHeight) {
        if (canSplitElement(element, config)) {
          const tag = element.tagName.toLowerCase()
          if (tag === 'ul' || tag === 'ol') {
            state = handleListPagination(element, state, wrapper, maxPageHeight)
            continue
          }
        }
        // 不可分割的超高元素：独占新页
        state = startNewPage(wrapper, state)
        state.page.appendChild(element)
        state.height = elementHeight
      }
      else {
        // 当前页剩余空间不够 → 换页
        if (state.height + elementHeight > maxPageHeight) {
          state = startNewPage(wrapper, state)
        }
        state.page.appendChild(element)
        state.height += elementHeight
      }
    }

    // 截断到仅第一页（仅当实际超过一页时才截断）
    if (config.truncateToOnePage && state.index > 1) {
      wrapper.innerHTML = (wrapper.firstChild as HTMLElement).outerHTML
    }
  }
  catch (error) {
    console.error('Error during pagination:', error)
    wrapper.innerHTML = content
  }
  finally {
    // 始终清理临时容器
    if (tempContainer.parentNode) {
      document.body.removeChild(tempContainer)
    }
  }
}
