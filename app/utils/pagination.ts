// 分页配置接口
export interface PaginationConfig {
  pageHeight: number
  padding: number
  noSplitTags: string[]
  themeClass: string
}

// 默认配置
export const DEFAULT_CONFIG: PaginationConfig = {
  pageHeight: 1070,
  padding: 36,
  noSplitTags: ['img', 'table', 'pre', 'code'],
  themeClass: 'prose',
}

// 获取元素的实际高度
export function getElementHeight(element: HTMLElement): number {
  try {
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
    const maxPageHeight = config.pageHeight - (config.padding * 2)

    // 清空现有内容
    wrapper.innerHTML = ''

    // 创建临时容器用于计算
    const tempContainer = document.createElement('div')
    tempContainer.className = `temp-container ${config.themeClass}`
    tempContainer.innerHTML = content
    document.body.appendChild(tempContainer)

    // 获取所有需要分页的元素
    const elements = Array.from(tempContainer.children) as HTMLElement[]

    // 创建第一页
    let currentPage = createNewPage()
    wrapper.appendChild(currentPage)

    // 当前页面已使用的高度
    let currentPageHeight = 0

    // 遍历所有元素
    for (const element of elements) {
      const elementHeight = getElementHeight(element)

      // 如果当前元素高度超过页面高度，需要特殊处理
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
          }
        }
        else {
          // 不可分割的元素，直接创建新页面
          wrapper.appendChild(createPageSplit())
          currentPage = createNewPage()
          wrapper.appendChild(currentPage)
          currentPage.appendChild(element)
          currentPageHeight = elementHeight
        }
      }
      else {
        // 检查添加当前元素是否会超出页面高度
        if (currentPageHeight + elementHeight > maxPageHeight) {
          wrapper.appendChild(createPageSplit())
          currentPage = createNewPage()
          wrapper.appendChild(currentPage)
          currentPageHeight = 0
        }

        currentPage.appendChild(element)
        currentPageHeight += elementHeight
      }
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
