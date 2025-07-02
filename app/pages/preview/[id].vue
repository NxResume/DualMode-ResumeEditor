<script setup lang="ts">
import type { MarkdownPreview } from '#components'
import { Download, FileImage } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useResumeStore } from '@/stores/resume'

const route = useRoute()
const resumeStore = useResumeStore()
const { t } = useI18n()

// 根据路由参数切换简历
const resumeId = (route.params as Record<string, any>)?.id as string | undefined

watch(() => resumeId, () => {
  if (!resumeId)
    return

  resumeStore.fetchResumesById(resumeId)
})

onMounted(() => {
  if (!resumeId)
    return

  resumeStore.fetchResumesById(resumeId)
})

const preRef = ref<InstanceType<typeof MarkdownPreview>>()
const pdfLoading = ref(false)
const imageLoading = ref(false)

definePageMeta({
  layout: false,
  middleware: 'sidebase-auth',
})

async function handleExportPDF() {
  if (pdfLoading.value)
    return
  pdfLoading.value = true
  try {
    await preRef.value?.exportToPDF()
  }
  finally {
    pdfLoading.value = false
  }
}

async function handleExportImage() {
  if (imageLoading.value)
    return
  imageLoading.value = true
  try {
    await preRef.value?.exportToImage()
  }
  finally {
    imageLoading.value = false
  }
}
</script>

<template>
  <div class="flex h-full justify-center relative">
    <MarkdownPreview ref="preRef" :content="resumeStore.resumeContent" />

    <!-- 导出按钮 -->
    <div class="flex gap-3 bottom-6 right-6 fixed z-50">
      <Button
        variant="outline"
        size="sm"
        :disabled="imageLoading"
        class="bg-white/90 cursor-pointer shadow-lg backdrop-blur-sm hover:bg-white disabled:opacity-70 disabled:cursor-not-allowed"
        @click="handleExportImage"
      >
        <svg
          v-if="imageLoading"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          class="mr-2 animate-spin"
        >
          <path
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="2"
            d="M12 6.99998C9.1747 6.99987 6.99997 9.24998 7 12C7.00003 14.55 9.02119 17 12 17C14.7712 17 17 14.75 17 12"
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              dur="560ms"
              from="0,12,12"
              repeatCount="indefinite"
              to="360,12,12"
              type="rotate"
            />
          </path>
        </svg>
        <FileImage v-else class="mr-2 h-4 w-4" />
        {{ imageLoading ? t('export.exporting') : t('export.exportImage') }}
      </Button>
      <Button
        size="sm"
        :disabled="pdfLoading"
        class="cursor-pointer shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
        @click="handleExportPDF"
      >
        <svg
          v-if="pdfLoading"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          class="mr-2 animate-spin"
        >
          <path
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="2"
            d="M12 6.99998C9.1747 6.99987 6.99997 9.24998 7 12C7.00003 14.55 9.02119 17 12 17C14.7712 17 17 14.75 17 12"
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              dur="560ms"
              from="0,12,12"
              repeatCount="indefinite"
              to="360,12,12"
              type="rotate"
            />
          </path>
        </svg>
        <Download v-else class="mr-2 h-4 w-4" />
        {{ pdfLoading ? t('export.exporting') : t('export.exportPdf') }}
      </Button>
    </div>
  </div>
</template>
