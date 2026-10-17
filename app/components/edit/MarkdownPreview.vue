<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useBeforeLeaveConfirm } from '~/composables/useBeforeLeaveConfirm'
import { exportToImage, exportToPDF, printToPDF } from '~/utils/download'

const props = defineProps<{
  content?: string
  settings?: ResumeSettings
  theme?: string
}>()

const emit = defineEmits<{
  (e: 'update:content', content?: string): void
  (e: 'update:image-position', imagePosition?: any): void
}>()

const { t } = useI18n()
const previewRef = ref<HTMLElement | null>(null)
const { showLeaveConfirm, handleLeaveConfirm } = useBeforeLeaveConfirm()

const showPrintTip = ref(false)
let printTipResolve: ((ok: boolean) => void) | null = null

function askPrintTip(): Promise<boolean> {
  showPrintTip.value = true
  return new Promise((resolve) => {
    printTipResolve = resolve
  })
}

function finishPrintTip(ok: boolean) {
  if (!printTipResolve)
    return
  const resolve = printTipResolve
  printTipResolve = null
  showPrintTip.value = false
  resolve(ok)
}

function onPrintTipOpenChange(open: boolean) {
  if (!open)
    finishPrintTip(false)
}

async function handleExportPDF() {
  await exportToPDF(previewRef.value)
}

async function handlePrintPDF() {
  const ok = await askPrintTip()
  if (!ok)
    return
  await printToPDF(previewRef.value)
}

async function handleExportImage() {
  await exportToImage(previewRef.value)
}

defineExpose({
  exportToPDF: handleExportPDF,
  printToPDF: handlePrintPDF,
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
    <!-- 打印前提示：系统对话框无法代用户取消页眉页脚 -->
    <Dialog :open="showPrintTip" @update:open="onPrintTipOpenChange">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('export.printTipTitle') }}</DialogTitle>
          <DialogDescription>
            {{ t('export.printTipDescription') }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="finishPrintTip(false)">
            {{ t('common.cancel') }}
          </Button>
          <Button @click="finishPrintTip(true)">
            {{ t('export.printTipContinue') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
