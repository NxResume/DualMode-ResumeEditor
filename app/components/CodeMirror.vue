<script setup lang="ts">
import { defaultKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { useWysiwyg } from '~/composables/useWysiwyg'
import { WysiwygTags } from '~/constants'

const props = defineProps<{
  modelValue: string
  mode: 'source' | 'wysiwyg'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorRef = ref<HTMLElement>()
let view: EditorView | undefined

const { previewRef, handlePaste, handleWysiwygEdit, updatePreview, handleFormat } = useWysiwyg(props, emit)

const hoverTag = ref<HTMLElement | null>(null)
const hoverType = ref<string>('')
const hoverToolbarStyle = ref<Record<string, string>>({})
const showToolbar = ref(false)
const isToolbarActive = ref(false)

function clearHighlight() {
  if (hoverTag.value) {
    hoverTag.value.classList.remove('wysiwyg-hover-highlight')
  }
}

function onMouseMove(e: MouseEvent) {
  if (props.mode !== 'wysiwyg')
    return
  const target = e.target as HTMLElement
  if (!target)
    return
  const tag = target.tagName.toLowerCase()
  if (WysiwygTags.includes(tag)) {
    if (hoverTag.value !== target) {
      clearHighlight()
      hoverTag.value = target
      hoverType.value = tag
      // 计算控件位置（右侧）
      const rect = target.getBoundingClientRect()
      hoverToolbarStyle.value = {
        top: `${rect.top + window.scrollY}px`,
        left: `${rect.right + 8 + window.scrollX}px`,
      }
      target.classList.add('wysiwyg-hover-highlight')
    }
    showToolbar.value = true
  }
}

function onMouseLeave() {
  clearHighlight()
  hoverTag.value = null
  hoverType.value = ''
  if (!isToolbarActive.value) {
    showToolbar.value = false
  }
}

// 监听模式变化
watch(() => props.mode, (newMode) => {
  if (newMode === 'wysiwyg') {
    // 在切换到 WYSIWYG 模式时，确保内容同步
    if (view) {
      const currentContent = view.state.doc.toString()
      if (currentContent !== props.modelValue) {
        emit('update:modelValue', currentContent)
      }
    }
    // 确保在内容更新后再更新预览
    nextTick(() => {
      updatePreview()
    })
  }
  else {
    // 在切换到 source 模式时，确保编辑器内容是最新的
    nextTick(() => {
      if (view) {
        // 先销毁旧的编辑器实例
        view.destroy()
        view = undefined
      }
      // 重新初始化编辑器
      initEditor()
    })
  }
})

// 初始化编辑器
function initEditor() {
  if (!editorRef.value)
    return

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      keymap.of(defaultKeymap as any),
      markdown(),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          emit('update:modelValue', update.state.doc.toString())
        }
      }),
    ],
  })

  view = new EditorView({
    state,
    parent: editorRef.value,
  })
}

onMounted(() => {
  initEditor()
})

// 监听内容变化
watch(() => props.modelValue, (newValue) => {
  if (view && newValue !== view.state.doc.toString()) {
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: newValue,
      },
    })
  }
})

onUnmounted(() => {
  view?.destroy()
})
</script>

<template>
  <div class="h-full">
    <div v-if="mode === 'source'" ref="editorRef" class="h-full" />
    <div
      v-else
      ref="previewRef"
      class="p-4 h-full prose overflow-visible!"
      contenteditable="true"
      @input="handleWysiwygEdit"
      @paste="handlePaste"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
    />
    <HoverToolbar
      :visible="showToolbar"
      :current-type="hoverType"
      :types="WysiwygTags"
      :style="hoverToolbarStyle"
      @format="handleFormat"
    />
  </div>
</template>

<style>
.ͼ1.cm-focused {
  outline: 2px solid #000;
  @apply rounded-xs;
}

.prose {
  @apply text-gray-800;
}

.prose h1 {
  @apply text-2xl font-bold mb-4;
}

.prose h2 {
  @apply text-xl font-bold mb-3;
}

.prose h3 {
  @apply text-lg font-bold mb-2;
}

.prose p {
  @apply mb-4;
}

.prose ul {
  @apply list-disc mb-4;
}

.prose ol {
  @apply list-decimal mb-4;
}

.prose code {
  @apply bg-gray-100 px-1 py-0.5 rounded;
}

.prose pre {
  @apply bg-gray-100 p-4 rounded mb-4 overflow-x-auto;
}

.prose blockquote {
  @apply border-l-4 border-gray-300 pl-4 italic mb-4;
}

.prose p a {
  @apply mx-1;
}

.prose a {
  @apply text-blue-600 hover:underline;
}

/* 编辑模式样式 */
.prose[contenteditable='true'] {
  @apply outline-none;
}

.prose[contenteditable='true']:focus {
  @apply outline-none;
}

.prose[contenteditable='true'] * {
  @apply cursor-text;
}

/* 选中文本样式 */
.prose[contenteditable='true']::selection {
  @apply bg-blue-200;
}

/* 占位符样式 */
.prose[contenteditable='true']:empty:before {
  content: '开始编辑...';
  @apply text-gray-400;
}

/* 编辑时的过渡效果 */
.prose[contenteditable='true'] * {
  @apply transition-colors duration-200;
}

/* 编辑时的悬停效果 */
.prose[contenteditable='true'] *:hover {
  @apply bg-gray-50;
}

/* 确保内容可见 */
.prose > * {
  @apply block;
}

/* 修复列表样式 */
.prose ul li,
.prose ol li {
  @apply mb-1;
}

/* 修复代码块样式 */
.prose pre code {
  @apply block p-0 bg-transparent;
}

/* 修复行内代码样式 */
.prose p code {
  @apply inline-block;
}

/* 确保内容区域可滚动 */
.prose {
  @apply overflow-auto;
}

/* 修复标题样式 */
.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  @apply mt-4 mb-2;
}

/* 修复段落间距 */
.prose p {
  @apply my-2;
}

/* 修复列表间距 */
.prose ul,
.prose ol {
  @apply my-2;
}

/* 修复引用样式 */
.prose blockquote {
  @apply my-2 pl-4 border-l-4 border-gray-300;
}

/* 修复表格样式 */
.prose table {
  @apply my-2 w-full;
}

.prose th,
.prose td {
  @apply border border-gray-300 p-2;
}

.wysiwyg-hover-highlight {
  background: #e6f7ff !important;
  transition: background 0.15s;
}
</style>
