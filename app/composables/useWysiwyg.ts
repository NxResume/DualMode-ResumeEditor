import MarkdownIt from 'markdown-it'
import TurndownService from 'turndown'
import { nextTick, onMounted, ref, watch } from 'vue'

export function useWysiwyg(props: { modelValue: string }, emit: (event: 'update:modelValue', value: string) => void) {
  const previewRef = ref<HTMLElement | null>(null)
  let isUpdating = false

  // 配置 Markdown 渲染器
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  })

  // 配置 Turndown 转换器
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    bulletListMarker: '-',
  })

  turndown.addRule('twoSpaceList', {
    filter: 'li',
    replacement: (content) => {
      const bullet = turndown.options.bulletListMarker || '*'
      return `${bullet} ${content.trimStart()}\n`
    },
  })

  turndown.addRule('strikethrough', {
    filter: ['del', 's'],
    replacement: (content: string) => `~~${content}~~`,
  })

  turndown.addRule('preserveTags', {
    filter: (node) => {
      return node.nodeType === 1
        && node.nodeName.toLowerCase() === 'a'
        && (node as HTMLElement).classList.contains('p')
    },
    replacement: (content, node) => {
      return (node as HTMLElement).outerHTML
    },
  })

  // 更新内容
  const updateContent = (content: string) => {
    if (isUpdating)
      return
    isUpdating = true
    emit('update:modelValue', content)
    nextTick(() => {
      isUpdating = false
    })
  }

  // 处理标题和内容控件
  const handleFormat = (type: 'h1' | 'h2' | 'h3' | 'h4' | 'p') => {
    if (!previewRef.value)
      return

    const selection = window.getSelection()
    if (!selection || !selection.rangeCount)
      return

    const range = selection.getRangeAt(0)
    const selectedContent = range.toString()
    const parentElement = range.commonAncestorContainer.parentElement

    if (!parentElement)
      return

    // 如果已经是目标类型，不做任何改变
    if (parentElement.tagName.toLowerCase() === type) {
      return
    }

    // 创建新的元素
    const newElement = document.createElement(type)

    const isCollapsed = range.collapsed

    if (selectedContent) {
      // 如果有选中内容，替换它
      newElement.textContent = selectedContent
      range.deleteContents()
      range.insertNode(newElement)
    }
    else {
      // 如果没有选中内容，将当前段落转换为目标类型
      // 保存当前元素的所有子节点
      const childNodes = Array.from(parentElement.childNodes)

      // 将子节点移动到新元素中
      childNodes.forEach((child) => {
        newElement.appendChild(child)
      })

      // 替换当前元素
      parentElement.parentNode?.replaceChild(newElement, parentElement)
    }

    // 恢复光标位置
    nextTick(() => {
      if (!selection || !newElement)
        return

      const newRange = document.createRange()

      if (isCollapsed) {
        // 如果之前是折叠的选区，将光标放在新元素的开始位置
        newRange.setStart(newElement, 0)
        newRange.setEnd(newElement, 0)
      }
      else {
        // 如果有选中内容，将选区设置为整个新元素
        newRange.selectNodeContents(newElement)
      }

      selection.removeAllRanges()
      selection.addRange(newRange)
    })

    // 更新内容
    const markdown = turndown.turndown(previewRef.value.innerHTML)
    updateContent(markdown)
  }

  // 处理粘贴事件
  const handlePaste = async (event: ClipboardEvent) => {
    event.preventDefault()

    try {
      const text = event.clipboardData?.getData('text/plain') || ''
      if (!text || !previewRef.value)
        return

      const selection = window.getSelection()
      if (!selection || !selection.rangeCount)
        return

      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(document.createTextNode(text))

      // 更新内容
      const markdown = turndown.turndown(previewRef.value.innerHTML)
      updateContent(markdown)
    }
    catch (error) {
      console.error('Paste failed:', error)
    }
  }

  // 处理 WYSIWYG 编辑
  const handleWysiwygEdit = (event: Event) => {
    if (isUpdating)
      return

    const target = event.target as HTMLElement
    if (!target)
      return

    if (!target.innerHTML.trim()) {
      updateContent('')
      return
    }

    // 更新内容
    const markdown = turndown.turndown(target.innerHTML)
    updateContent(markdown)
  }

  // 更新预览内容
  const updatePreview = () => {
    if (!previewRef.value || isUpdating)
      return

    isUpdating = true
    previewRef.value.innerHTML = md.render(props.modelValue)
    nextTick(() => {
      isUpdating = false
    })
  }

  // 监听内容变化
  watch(() => props.modelValue, (_newValue) => {
    if (previewRef.value) {
      updatePreview()
    }
  })

  // 组件挂载时初始化内容
  onMounted(() => {
    if (previewRef.value) {
      previewRef.value.innerHTML = md.render(props.modelValue)
    }
  })

  return {
    previewRef,
    handlePaste,
    handleWysiwygEdit,
    updatePreview,
    handleFormat,
  }
}
