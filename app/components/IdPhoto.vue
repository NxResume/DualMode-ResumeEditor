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

const { files, open, reset } = useFileDialog({
  accept: 'image/*', // Set to accept only image files
  multiple: false,
})

// 图片预览URL
const imagePreviewUrl = ref<string | null>(null)

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
}

// 确认上传
function handleConfirm() {
  // 这里可以添加确认上传的逻辑
  // 确认上传操作
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
  <Dialog>
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>上传证件照</DialogTitle>
        <DialogDescription>
          请上传您的证件照，支持 JPG、PNG 格式，文件大小不超过 5MB
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
                v-if="imagePreviewUrl"
                :src="imagePreviewUrl"
                alt="证件照预览"
                class="h-full w-full object-cover"
              >
              <svg
                v-else
                class="text-gray-400 h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>

            <!-- 上传提示文字 -->
            <div class="space-y-2">
              <p v-if="!imagePreviewUrl" class="text-lg text-gray-900 font-medium">
                点击上传证件照
              </p>
              <p v-else class="text-lg text-gray-900 font-medium">
                点击更换证件照
              </p>
              <p class="text-sm text-gray-500">
                或将文件拖拽到此处
              </p>
            </div>

            <!-- 文件信息显示 -->
            <div v-if="files && files.length > 0 && files[0]" class="mt-4">
              <p class="text-sm text-green-600">
                已选择: {{ files[0].name }}
              </p>
              <p class="text-xs text-gray-500">
                大小: {{ (files[0].size / 1024 / 1024).toFixed(2) }} MB
              </p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="flex justify-between">
        <Button
          variant="outline"
          :disabled="!files || files.length === 0"
          @click="handleReset"
        >
          重置头像
        </Button>
        <Button
          :disabled="!files || files.length === 0"
          @click="handleConfirm"
        >
          确认上传
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
