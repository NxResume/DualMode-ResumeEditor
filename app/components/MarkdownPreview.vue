<script setup lang="ts">
import { toPng } from 'html-to-image'
import { autoPaginate, DEFAULT_CONFIG } from '~/utils/pagination'

import '@/assets/theme/default.css'

const props = defineProps<{
  content: string
}>()

const theme = 'markdown-body'

const md = computed(() => useMarkdown(props.content))
const previewRef = ref<HTMLElement | null>(null)

async function exportToPDF() {
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

    // 使用 html-to-image 转换页面
    const dataUrl = await toPng(page, {
      quality: 1.0,
      pixelRatio: 2,
      skipFonts: false,
      filter: () => {
        return true
      },
      style: {
        transform: 'none',
      },
    })

    // 计算尺寸
    const imgWidth = 595.28
    const imgHeight = 592.28 / page.offsetWidth * page.offsetHeight

    // 如果不是第一页，添加新页面
    if (i > 0) {
      pdf.addPage()
    }

    // 添加图片到 PDF
    pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight)
  }

  // 保存 PDF
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

defineExpose({
  exportToPDF,
})
</script>

<template>
  <div class="preview-content py-10">
    <div ref="previewRef" class="preview-container">
      <div class="rs-page-item-wrapper" :class="theme" />
    </div>
  </div>
</template>

<style>
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

/* 添加导出按钮样式 */
.export-button {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 100;
  padding: 12px 24px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.export-button:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.export-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 添加暗色模式支持 */
.dark .export-button {
  background-color: #2563eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.dark .export-button:hover {
  background-color: #1d4ed8;
}
</style>
