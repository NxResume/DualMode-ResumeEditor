<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useBeforeLeaveConfirm } from '~/composables/useBeforeLeaveConfirm'

const props = defineProps<{
  content?: string
  settings?: ResumeSettings
  theme?: string
}>()

const emit = defineEmits<{
  (e: 'update:content', content?: string): void
  (e: 'update:image-position', imagePosition?: any): void
}>()

const previewRef = ref<HTMLElement | null>(null)
const { showLeaveConfirm, handleLeaveConfirm } = useBeforeLeaveConfirm()

async function handleExportPDF() {
  await exportToPDF(previewRef.value)
}

async function handleExportImage() {
  await exportToImage(previewRef.value)
}

defineExpose({
  exportToPDF: handleExportPDF,
  exportToImage: handleExportImage,
})
</script>

<template>
  <div class="preview-content py-10">
    <div ref="previewRef" class="preview-container">
      <PluginPhotoIdPhotoMoveable
        :content="props.content"
        :preview-ref="previewRef"
        :settings="props.settings"
        @update:content="emit('update:content', $event)"
        @update:image-position="emit('update:image-position', $event)"
      />
      <EditMarkdownContentPreview
        :content="props.content"
        :theme-name="props.theme"
        :settings="props.settings"
      />
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
