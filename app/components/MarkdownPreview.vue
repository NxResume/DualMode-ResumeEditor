<script setup lang="ts">
import html2canvas from 'html2canvas'
import { autoPaginate, DEFAULT_CONFIG } from '~/utils/pagination'

import '@/assets/theme/github.css'

const props = defineProps<{
  content: string
}>()

const theme = 'markdown-body'

const md = computed(() => useMarkdown(props.content))
const previewRef = ref<HTMLElement | null>(null)

async function exportPDF() {
  if (!previewRef.value)
    return

  const wrapper = previewRef.value.querySelector('.rs-page-item-wrapper')
  if (!wrapper)
    return

  const pages = wrapper.querySelectorAll('.rs-page-item')
  if (pages.length === 0)
    return

  // 动态导入 jsPDF
  const { jsPDF: PDF } = await import('jspdf')

  // 创建 PDF 文档
  const pdf = new PDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  })

  // 遍历每一页
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i] as HTMLElement

    // 使用 html2canvas 将页面转换为 canvas
    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    // 计算尺寸
    const contentWidth = canvas.width
    const contentHeight = canvas.height
    const pageHeight = contentWidth / 592.28 * 841.89
    const leftHeight = contentHeight
    const imgWidth = 595.28
    const imgHeight = 592.28 / contentWidth * contentHeight

    // 将 canvas 转换为图片
    const imgData = canvas.toDataURL('image/jpeg', 1)

    // 如果不是第一页，添加新页面
    if (i > 0) {
      pdf.addPage()
    }

    // 如果内容未超过一页
    if (leftHeight < pageHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight)
    }
    else {
      // 分页处理
      let position = 0
      let remainingHeight = leftHeight
      while (remainingHeight > 0) {
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        remainingHeight -= pageHeight
        position -= 841.89
        if (remainingHeight > 0) {
          pdf.addPage()
        }
      }
    }
  }

  // 保存 pdf
  pdf.save('resume.pdf')
}

// 提取重复逻辑为独立函数
function handleAutoPaginate() {
  nextTick(() => {
    if (previewRef.value) {
      const wrapper = previewRef.value.querySelector('.rs-page-item-wrapper')
      if (wrapper) {
        autoPaginate(wrapper as HTMLElement, md.value.html, {
          ...DEFAULT_CONFIG,
          themeClass: theme,
        })
      }
    }
  })
}

// 监听内容变化
watch(() => props.content, handleAutoPaginate)

onMounted(handleAutoPaginate)
</script>

<template>
  <div class="preview-content">
    <div class="mb-4 flex justify-end">
      <button
        class="text-white px-4 py-2 rounded-lg bg-blue-600 transition-colors hover:bg-blue-700"
        @click="exportPDF"
      >
        导出 PDF
      </button>
    </div>
    <div ref="previewRef" class="preview-container">
      <div class="rs-page-item-wrapper" :class="theme" />
    </div>
  </div>
</template>

<style>
.lr-container .left {
  width: 50%;
  float: left;
}

.lr-container .right {
  width: 50%;
  float: right;
}

.lr-container {
  /* 方案1：推荐 */
  overflow: hidden;

  /* 或方案3：推荐 */
  /* &::after { content: ""; display: table; clear: both; } */

  padding: 15px;
  /* 可选：增加内边距 */
}

/* 分页样式 */
.rs-page-item-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.rs-page-item {
  width: 794px;
  max-width: 794px;
  min-height: 1070px;
  max-height: 1070px;
  background: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  padding: 36px;
  overflow: hidden;
}

.rs-line-split {
  width: 794px;
  height: 1px;
  background: #ccc;
  position: relative;
}

.rs-line-split::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -5px;
  height: 10px;
  background: linear-gradient(to right, transparent, #ccc, transparent);
}

/* 临时容器样式 */
.temp-container {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  width: 794px;
}

/* 暗色模式 */
.dark .rs-page-item {
  background: #1a1a1a;
}

.dark .rs-line-split {
  background: #444;
}

.dark .rs-line-split::before {
  background: linear-gradient(to right, transparent, #444, transparent);
}

/* 内容样式 */
.rs-page-item :deep(h1) {
  font-size: 2em;
  margin-bottom: 0.5em;
}

.rs-page-item :deep(h2) {
  font-size: 1.5em;
  margin-bottom: 0.5em;
}

.rs-page-item :deep(p) {
  margin-bottom: 1em;
  line-height: 1.6;
}

.rs-page-item :deep(ul),
.rs-page-item :deep(ol) {
  margin-bottom: 1em;
  padding-left: 2em;
}

.rs-page-item :deep(li) {
  margin-bottom: 0.5em;
}

.rs-page-item :deep(a) {
  color: #3b82f6;
  text-decoration: none;
}

.rs-page-item :deep(a:hover) {
  text-decoration: underline;
}

.rs-page-item :deep(.tag) {
  display: inline-block;
  padding: 0.2em 0.6em;
  background: #e5e7eb;
  border-radius: 4px;
  margin-right: 0.5em;
  margin-bottom: 0.5em;
  font-size: 0.9em;
}

.dark .rs-page-item :deep(.tag) {
  background: #374151;
}

.rs-page-item {
  width: 794px;
  margin: 0 auto;
}
</style>
