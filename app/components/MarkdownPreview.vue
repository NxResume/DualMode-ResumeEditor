<script setup lang="ts">
import { isClient } from '@vueuse/core'
import { exportToImage, exportToPDF } from '@/utils/download'
import { useResumeStore } from '~/stores/resume'
import { useResumeSettingsStore } from '~/stores/resumeSettings'
import { autoPaginate, DEFAULT_CONFIG } from '~/utils/pagination'

const props = defineProps<{
  content: string | undefined
}>()

const theme = 'markdown-body'
const md = computed(() => useMarkdown(props.content))
const previewRef = ref<HTMLElement | null>(null)
const isShowMoveabled = ref(false)

async function handleExportPDF() {
  await exportToPDF(previewRef.value)
}

function handleExportImage() {
  exportToImage(previewRef.value)
}

// 监听内容变化
const resumeStore = useResumeStore()
const resumeSettingsStore = useResumeSettingsStore()
// 提取重复逻辑为独立函数
function handleAutoPaginate() {
  nextTick(() => {
    setTimeout(() => {
      if (previewRef.value) {
        const wrapper = previewRef.value.querySelector('.rs-page-item-wrapper')
        if (wrapper) {
          autoPaginate(wrapper as HTMLElement, md.value.html, {
            ...DEFAULT_CONFIG,
            themeClass: theme,
            themeName: resumeStore.currentResume?.theme,
            padding: resumeSettingsStore.currentSettings.pagePadding,
          })
        }
      }
    }, 0)
  })
}

function bindImageClickEvent() {
  if (!previewRef.value)
    return

  // 使用事件委托监听 previewRef 内部所有 img[data-id-photo]
  previewRef.value.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (target.tagName.toLowerCase() === 'img' && target.hasAttribute('data-id-photo')) {
      isShowMoveabled.value = true
    }
    else {
      isShowMoveabled.value = false
    }
  })
}

function updatePostion() {
  if (isClient) {
    nextTick(() => {
      const pot = resumeSettingsStore.currentSettings.imagePosition
      document.documentElement.style.setProperty('--id-photo-top', `${pot.top}px`)
      document.documentElement.style.setProperty('--id-photo-left', `${pot.left}px`)
      document.documentElement.style.setProperty('--id-photo-scale', pot.scale.toString())
    })
  }
}

watch(() => resumeSettingsStore.currentSettings.imagePosition, () => {
  updatePostion()
}, { immediate: true, deep: true })

onMounted(() => {
  updatePostion()
})

watch(() => [
  props.content,
  resumeStore.currentResume?.theme,
  resumeSettingsStore.currentSettings.pagePadding,
  resumeSettingsStore.currentSettings.pageLineHeight,
  resumeSettingsStore.currentSettings.fontname,
], () => {
  handleAutoPaginate()
})

// Add keydown event for Delete key to remove ID photo
function handleKeyDown(event: KeyboardEvent) {
  if (isShowMoveabled.value && event.key === 'Backspace') {
    // Remove <img id="id-photo" ...> from resumeStore.resumeContent
    const imgTagRegex = /<img[^>]*id\s*=\s*['"]id-photo['"][^>]*>/gi
    resumeStore.resumeContent = resumeStore.resumeContent.replace(imgTagRegex, '')
    isShowMoveabled.value = false
  }
}

onMounted(() => {
  handleAutoPaginate()
  bindImageClickEvent()

  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

defineExpose({
  exportToPDF: handleExportPDF,
  exportToImage: handleExportImage,
})
</script>

<template>
  <div class="preview-content py-10">
    <div ref="previewRef" class="preview-container">
      <PluginImageMoveable v-if="isShowMoveabled" />
      <div class="rs-page-item-wrapper" :class="theme" />
    </div>
  </div>
</template>

<style>
/* 分页样式 */
.rs-page-item-wrapper {
  width: fit-content !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.rs-page-item {
  position: relative;
  width: 794px;
  max-width: 794px;
  min-height: 1070px;
  max-height: 1070px;
  background: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  padding: var(--resume-page-padding-size, '36px');
  overflow: hidden;
  z-index: 1;
}

.rs-page-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: var(--resume-page-background) no-repeat;
  background-size: contain;
  z-index: -1;
}

.rs-page-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: var(--resume-page-background) no-repeat;
  background-size: contain;
  z-index: -1;
  pointer-events: none;
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

/* 导出按钮容器样式 */
.export-buttons {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 100;
  display: flex;
  gap: 10px;
}

#id-photo {
  position: absolute;
  z-index: 20;
  width: 140px;
  top: var(--id-photo-top, 66px);
  left: var(--id-photo-left, 391px);
  transform: scale(var(--id-photo-scale, '0.8 0.8'));
  border-radius: 6px;
}
</style>
