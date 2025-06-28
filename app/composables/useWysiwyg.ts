import type { WysiwygTagsType } from '~/constants'
import MarkdownIt from 'markdown-it'
import TurndownService from 'turndown'
import { nextTick, onMounted, ref, watch } from 'vue'
import { WysiwygTags } from '~/constants'

export function useWysiwyg(props: { modelValue: string | undefined }, emit: (event: 'update:modelValue', value: string) => void) {
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

  turndown.addRule('preserveSpecialElements', {
    filter: (node) => {
      return (
        (node.nodeType === 1 && node.nodeName.toLowerCase() === 'a' && (node as HTMLElement).classList.contains('p'))
        || (node.nodeType === 1 && node.nodeName.toLowerCase() === 'img' && (node as HTMLElement).hasAttribute('data-id-photo'))
      )
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
  const handleFormat = (type: WysiwygTagsType) => {
    try {
      if (!previewRef.value)
        return

      const selection = window.getSelection()
      if (!selection || !selection.rangeCount)
        return

      const range = selection.getRangeAt(0)
      let node = range.commonAncestorContainer
      while (node && node.nodeType === 3) {
        node = node.parentNode as Node
      }
      let block = node as HTMLElement | null
      while (block && block.parentElement && !WysiwygTags.includes(block.tagName?.toLowerCase?.() as WysiwygTagsType)) {
        block = block.parentElement
      }
      if (!block)
        return

      // 如果已经是目标类型，不做任何改变
      if (block.tagName.toLowerCase() === type) {
        return
      }

      // 创建新的元素
      const newElement = document.createElement(type)
      // 复制原有内容
      newElement.innerHTML = block.innerHTML

      // 替换当前段落
      block.parentNode?.replaceChild(newElement, block)

      // 恢复光标位置
      nextTick(() => {
        const selection = window.getSelection()
        if (!selection || !newElement)
          return
        const newRange = document.createRange()
        newRange.setStart(newElement, 0)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      })

      // 更新内容
      const markdown = turndown.turndown(previewRef.value.innerHTML)
      updateContent(markdown)
    }
    catch (error) {
      console.error('Error in handleFormat:', error)
    }
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
    previewRef.value.innerHTML = md.render(props.modelValue as string)
    nextTick(() => {
      isUpdating = false
    })
  }

  // 监听内容变化
  watch(() => props.modelValue, (_newValue) => {
    if (previewRef.value && props.modelValue) {
      updatePreview()
    }
  })

  // 组件挂载时初始化内容
  onMounted(() => {
    if (previewRef.value && props.modelValue) {
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
