// 分页配置接口
export interface PaginationConfig {
  pageHeight: number
  padding: number
  noSplitTags: string[]
  themeClass: string
  themeName: string
  truncateToOnePage?: boolean // 只展示第一页，超出部分丢弃
}

// 默认配置
export const DEFAULT_CONFIG: PaginationConfig = {
  pageHeight: 1070,
  padding: 36,
  noSplitTags: ['img', 'table', 'pre', 'code'],
  themeClass: 'prose',
  themeName: 'default',
}

// 特殊主题列表
export const themeListNoSpecial = [
  'blueSimplicity',
  'blackToppedSimple',
]

// 获取元素的实际高度
export function getElementHeight(element: HTMLElement): number {
  try {
    // 排除 img 元素且 id="id-photo" 的元素
    if (element.tagName.toLowerCase() === 'img' && element.id === 'id-photo') {
      return 0
    }

    const style = window.getComputedStyle(element)
    const marginTop = Number.parseFloat(style.marginTop)
    const marginBottom = Number.parseFloat(style.marginBottom)
    const paddingTop = Number.parseFloat(style.paddingTop)
    const paddingBottom = Number.parseFloat(style.paddingBottom)
    const totalHeight = element.offsetHeight + marginTop + marginBottom + paddingTop + paddingBottom

    return totalHeight
  }
  catch (error) {
    console.error('Error calculating element height:', error)
    return element.offsetHeight
  }
}

// 检查元素是否可以被分割
export function canSplitElement(element: HTMLElement, config: PaginationConfig): boolean {
  return !config.noSplitTags.includes(element.tagName.toLowerCase())
}

// 创建新页面
export function createNewPage(): HTMLElement {
  const page = document.createElement('div')
  page.className = 'rs-page-item'
  return page
}

// 创建分页线
export function createPageSplit(): HTMLElement {
  const split = document.createElement('div')
  split.className = 'rs-line-split'
  return split
}

// 处理列表分页
function handleListPagination(
  element: HTMLElement,
  currentPage: HTMLElement,
  wrapper: HTMLElement,
  currentPageHeight: number,
  maxPageHeight: number,
): { newPage: HTMLElement, newPageHeight: number } {
  const items = Array.from(element.children) as HTMLElement[]
  const currentItems: HTMLElement[] = []
  const remainingItems: HTMLElement[] = []
  let tempHeight = currentPageHeight

  // 计算每个项的高度并分配
  for (const item of items) {
    const height = getElementHeight(item)
    if (tempHeight + height > maxPageHeight) {
      remainingItems.push(item)
    }
    else {
      currentItems.push(item)
      tempHeight += height
    }
  }

  // 添加当前页面的列表项
  if (currentItems.length > 0) {
    const newList = document.createElement(element.tagName)
    newList.className = element.className
    currentItems.forEach(item => newList.appendChild(item))
    currentPage.appendChild(newList)
  }

  // 处理剩余项
  if (remainingItems.length > 0) {
    wrapper.appendChild(createPageSplit())
    const newPage = createNewPage()
    wrapper.appendChild(newPage)

    const remainingList = document.createElement(element.tagName)
    remainingList.className = element.className
    remainingItems.forEach(item => remainingList.appendChild(item))
    newPage.appendChild(remainingList)

    return {
      newPage,
      newPageHeight: getElementHeight(remainingList),
    }
  }

  return {
    newPage: currentPage,
    newPageHeight: tempHeight,
  }
}

// 自动分页函数
export function autoPaginate(
  wrapper: HTMLElement,
  content: string,
  customConfig?: Partial<PaginationConfig>,
) {
  try {
    // 合并配置
    const config = { ...DEFAULT_CONFIG, ...customConfig }
    // 清空现有内容
    wrapper.innerHTML = ''

    // 创建临时容器用于计算
    const tempContainer = document.createElement('div')
    tempContainer.className = `temp-container ${config.themeClass}`
    tempContainer.innerHTML = content
    document.body.appendChild(tempContainer)

    // 获取所有需要分页的元素
    const elements = Array.from(tempContainer.children) as HTMLElement[]

    // 创建第一页 + 添加页码跟踪
    let currentPage = createNewPage()
    let currentPageIndex = 1 // 当前页码从 1 开始
    wrapper.appendChild(currentPage)

    // 当前页面已使用的高度
    let currentPageHeight = 0

    // 判断当前主题是否属于特殊主题
    const isSpecialTheme = themeListNoSpecial.includes(config.themeName)
    // 遍历所有元素
    for (const element of elements) {
      const elementHeight = getElementHeight(element)
      // 如果是特殊主题且是第一页，移除 padding-top
      const maxPageHeight = isSpecialTheme && currentPageIndex === 1
        ? config.pageHeight - config.padding
        : config.pageHeight - config.padding * 2

      // 如果当前元素高度超过页面最大高度
      if (elementHeight > maxPageHeight) {
        // 如果元素可以被分割
        if (canSplitElement(element, config)) {
          // 处理可分割元素（如列表）
          if (element.tagName.toLowerCase() === 'ul' || element.tagName.toLowerCase() === 'ol') {
            const { newPage, newPageHeight } = handleListPagination(
              element,
              currentPage,
              wrapper,
              currentPageHeight,
              maxPageHeight,
            )

            currentPage = newPage
            currentPageHeight = newPageHeight

            // 新建页面后页码递增
            currentPageIndex++

            // 如果是特殊主题且是第一页，移除 padding-top
            if (isSpecialTheme && currentPageIndex === 1) {
              currentPage.style.paddingTop = '0px'
            }
          }
        }
        else {
          // 不可分割的元素，直接创建新页面
          wrapper.appendChild(createPageSplit())
          currentPage = createNewPage()
          currentPageIndex++ // 页码递增
          wrapper.appendChild(currentPage)

          // 如果是特殊主题且是第一页，移除 padding-top
          if (isSpecialTheme && currentPageIndex === 1) {
            currentPage.style.paddingTop = '0px'
          }

          currentPage.appendChild(element)
          currentPageHeight = elementHeight
        }
      }
      else {
        // 检查添加当前元素是否会超出页面高度
        if (currentPageHeight + elementHeight > maxPageHeight) {
          wrapper.appendChild(createPageSplit())
          currentPage = createNewPage()
          currentPageIndex++ // 页码递增
          wrapper.appendChild(currentPage)

          // 如果是特殊主题且是第一页，移除 padding-top
          if (isSpecialTheme && currentPageIndex === 1) {
            currentPage.style.paddingTop = '0px'
          }

          currentPageHeight = 0
        }

        currentPage.appendChild(element)
        currentPageHeight += elementHeight
      }
    }

    if (config.truncateToOnePage && currentPageIndex > 0) {
      wrapper.innerHTML = (wrapper.childNodes[0] as any)!.outerHTML
    }

    // 清理临时容器
    document.body.removeChild(tempContainer)
  }
  catch (error) {
    console.error('Error during pagination:', error)
    // 发生错误时，至少显示原始内容
    wrapper.innerHTML = content
  }
}
