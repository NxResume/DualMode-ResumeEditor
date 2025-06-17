import MarkdownIt from 'markdown-it'
import TurndownService from 'turndown'
import { nextTick, onMounted, ref, watch } from 'vue'

export function useWysiwyg(props: { modelValue: string }, emit: (event: 'update:modelValue', value: string) => void) {
  const previewRef = ref<HTMLElement | null>(null)

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
  })

  // 添加自定义规则
  turndown.addRule('strikethrough', {
    filter: ['del', 's'],
    replacement: (content: string) => `~~${content}~~`,
  })

  // 更新内容并保持光标位置
  const updateContent = (content: string, callback?: () => void) => {
    emit('update:modelValue', content)
    nextTick(() => {
      callback?.()
    })
  }

  // 处理粘贴事件
  const handlePaste = async (event: ClipboardEvent) => {
    event.preventDefault()

    try {
      const text = event.clipboardData?.getData('text/plain') || ''
      if (!text)
        return

      if (!previewRef.value)
        return

      const selection = window.getSelection()
      if (!selection || !selection.rangeCount)
        return

      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(document.createTextNode(text))

      // 更新内容并保持光标位置
      const markdown = turndown.turndown(previewRef.value.innerHTML)
      updateContent(markdown)
    }
    catch (error) {
      console.error('Paste failed:', error)
    }
  }

  // 处理 WYSIWYG 编辑
  const handleWysiwygEdit = (event: Event) => {
    const target = event.target as HTMLElement
    if (!target)
      return

    // 防止空内容
    if (!target.innerHTML.trim()) {
      updateContent('')
      return
    }

    // 更新内容并保持光标位置
    const markdown = turndown.turndown(target.innerHTML)
    updateContent(markdown)
  }

  // 更新预览内容
  const updatePreview = () => {
    if (previewRef.value) {
      nextTick(() => {
        if (previewRef.value) {
          previewRef.value.innerHTML = md.render(props.modelValue)
        }
      })
    }
  }

  // 监听内容变化
  watch(() => props.modelValue, updatePreview)

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
  }
}
