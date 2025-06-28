<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const { t } = useI18n()
const resumeStore = useResumeStore()

const { files, open, reset } = useFileDialog({
  accept: 'image/*', // Set to accept only image files
  multiple: false,
})

// 图片预览URL
const imagePreviewUrl = ref<string | null>(null)

const dialogOpen = ref(false)
const loading = ref(false)

function getIdPhotoSrcFromContent(content: string) {
  const imgTagRegex = /<img\b[^>]*>/gi
  const srcRegex = /\bsrc\s*=\s*["']([^"']+)["']/i
  const idRegex = /\bid\s*=\s*["']id-photo["']/i

  const imgTags = content.match(imgTagRegex)
  if (!imgTags)
    return null

  for (const tag of imgTags) {
    if (idRegex.test(tag)) {
      const srcMatch = tag.match(srcRegex)
      if (srcMatch)
        return srcMatch[1]
    }
  }
  return null
}

watch(() => resumeStore.resumeContent, () => {
  const src = getIdPhotoSrcFromContent(resumeStore.resumeContent)
  if (src) {
    imagePreviewUrl.value = src
  }
  else {
    imagePreviewUrl.value = ''
  }
})

onMounted(() => {
  const src = getIdPhotoSrcFromContent(resumeStore.resumeContent)
  if (src) {
    imagePreviewUrl.value = src
  }
})

// 处理文件上传
function handleFileUpload() {
  open()
}

// 处理文件变化
function handleFileChange(newFiles: FileList | null) {
  if (newFiles && newFiles.length > 0) {
    // 创建图片预览URL
    const file = newFiles[0]
    if (file) {
      imagePreviewUrl.value = URL.createObjectURL(file)
    }
  }
}

// 重置头像
function handleReset() {
  reset()
  // 清除图片预览
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = null
  }
  // 移除resumeStore.resumeContent中的id-photo图片
  // const imgTagRegex = /<img[^>]*id\s*=\s*['"]id-photo['"][^>]*>/gi
  // resumeStore.updateResume()
  dialogOpen.value = false // 关闭 Dialog
}

// 确认上传
function handleConfirm() {
  loading.value = true
  const uploadUrl = process.env.NODE_ENV === 'production'
    ? 'https://api.ryanuo.cc/api/meituan'
    : '/flask-upload'
  if (files.value && files.value.length > 0) {
    const file = files.value[0]
    if (file) {
      const formData = new FormData()
      formData.append('file', file)
      useFetch(uploadUrl, {
        method: 'POST',
        body: formData,
      }).then(({ data, error }) => {
        loading.value = false
        const result = data.value as {
          Jobs: string
        }
        if (result && result.Jobs) {
          const imgTag = `<img src="${result.Jobs}" id="id-photo" data-id-photo alt="" srcset="">`
          const imgTagRegex = /<img[^>]*id\s*=\s*['"]id-photo['"][^>]*>/gi
          let newContent = resumeStore.resumeContent.replace(imgTagRegex, '')
          newContent = `${imgTag}\n\n${newContent.trim()}`
          // resumeStore.setContent(newContent)
          dialogOpen.value = false // 上传成功后关闭 Dialog
        }
        else {
          console.error('图片上传失败:', error.value || '未知错误')
        }
      }).catch((err) => {
        loading.value = false
        console.error('图片上传异常:', err)
      })
    }
    else {
      loading.value = false
    }
  }
  else {
    loading.value = false
  }
}

// 监听文件变化
watch(files, (newFiles) => {
  handleFileChange(newFiles)
})

// 组件卸载时清理URL
onUnmounted(() => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
})
</script>

<template>
  <Dialog v-model:open="dialogOpen">
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>

    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{{ t('idPhoto.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('idPhoto.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="py-6">
        <!-- 上传区域 -->
        <div
          class="p-8 text-center border-2 border-gray-300 rounded-lg border-dashed cursor-pointer transition-colors hover:border-gray-400"
          @click="handleFileUpload"
        >
          <div class="flex flex-col items-center justify-center space-y-4">
            <!-- 图片预览或上传图标 -->
            <div class="rounded-full bg-gray-100 flex h-32 w-32 items-center justify-center overflow-hidden">
              <img
                v-if="imagePreviewUrl" :src="imagePreviewUrl" :alt="t('idPhoto.photoPreview')"
                class="h-full w-full object-cover"
              >
              <svg v-else class="text-gray-400 h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>

            <!-- 上传提示文字 -->
            <div class="space-y-2">
              <p v-if="!imagePreviewUrl" class="text-lg text-gray-900 font-medium">
                {{ t('idPhoto.uploadPhoto') }}
              </p>
              <p v-else class="text-lg text-gray-900 font-medium">
                {{ t('idPhoto.changePhoto') }}
              </p>
              <p class="text-sm text-gray-500">
                {{ t('idPhoto.dragDropHint') }}
              </p>
            </div>

            <!-- 文件信息显示 -->
            <div v-if="files && files.length > 0 && files[0]" class="mt-4">
              <p class="text-sm text-green-600">
                {{ t('idPhoto.selectedFile') }} {{ files[0].name }}
              </p>
              <p class="text-xs text-gray-500">
                {{ t('idPhoto.fileSize') }} {{ (files[0].size / 1024 / 1024).toFixed(2) }} MB
              </p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="flex justify-between">
        <Button variant="outline" class="cursor-pointer" :disabled="!imagePreviewUrl" @click="handleReset">
          {{ t('idPhoto.resetPhoto') }}
        </Button>
        <Button class="cursor-pointer" :disabled="!imagePreviewUrl || loading" @click="handleConfirm">
          <template v-if="loading">
            <svg class="mr-2 h-4 w-4 inline-block animate-spin" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            {{ t('idPhoto.uploading') }}
          </template>
          <template v-else>
            {{ t('idPhoto.confirmUpload') }}
          </template>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style>
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.DialogOverlay[data-state='open'],
.DialogContent[data-state='open'] {
  animation: fadeIn 300ms ease-out;
}

.DialogOverlay[data-state='closed'],
.DialogContent[data-state='closed'] {
  animation: fadeOut 300ms ease-in;
}
</style>
