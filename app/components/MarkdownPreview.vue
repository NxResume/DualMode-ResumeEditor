<script setup lang="ts">
import { isClient, useCssVar } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { exportToImage, exportToPDF } from '@/utils/download'
import { useResumeStore } from '~/stores/resume'
import { useResumeSettingsStore } from '~/stores/resumeSettings'
import { autoPaginate, DEFAULT_CONFIG } from '~/utils/pagination'

const props = defineProps<{
  content: string | undefined
}>()

const preventLeave = ref(true)
const showLeaveConfirm = ref(false)
const pendingNavigation = ref<any>(null)

// 1. 页面刷新 / 关闭 拦截
useBeforeUnload({
  enabled: preventLeave.value,
  message: '你有未保存的更改，确定要离开页面吗？',
})

// 2. 页面内部跳转拦截
onBeforeRouteLeave((to, from, next) => {
  if (!preventLeave.value)
    return next()

  showLeaveConfirm.value = true
  pendingNavigation.value = next
})

function handleLeaveConfirm(confirmed: boolean) {
  showLeaveConfirm.value = false
  if (pendingNavigation.value) {
    pendingNavigation.value(confirmed)
    pendingNavigation.value = null
  }
}

const theme = 'markdown-body'
const md = computed(() => useMarkdown(props.content))
const previewRef = ref<HTMLElement | null>(null)
const isShowMoveabled = ref(false)

// 使用 useCssVar 创建响应式的 CSS 变量
const idPhotoTop = useCssVar('--id-photo-top', document.documentElement)
const idPhotoLeft = useCssVar('--id-photo-left', document.documentElement)
const idPhotoScale = useCssVar('--id-photo-scale', document.documentElement)

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
      idPhotoTop.value = `${pot.top}px`
      idPhotoLeft.value = `${pot.left}px`
      idPhotoScale.value = pot.scale.toString()
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

    <!-- 离开确认对话框 -->
    <Dialog v-model:open="showLeaveConfirm">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认离开</DialogTitle>
          <DialogDescription>
            你有未保存的更改，确定要离开页面吗？
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="handleLeaveConfirm(false)">
            取消
          </Button>
          <Button @click="handleLeaveConfirm(true)">
            确定离开
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
