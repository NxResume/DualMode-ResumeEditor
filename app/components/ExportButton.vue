<script setup lang="ts">
const props = defineProps<{
  variant?: 'default' | 'header'
  onExport: () => Promise<void>
}>()

const loading = ref(false)
const { t } = useI18n()

async function handleClick() {
  if (loading.value)
    return
  loading.value = true
  try {
    await props.onExport()
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <button
    class="export-btn"
    :class="[
      { 'is-loading': loading },
      variant === 'header' ? 'header-btn' : 'default-btn',
    ]"
    :disabled="loading"
    @click="handleClick"
  >
    <div class="btn-content">
      <div class="i-ri-download-2-line" />
      <span>{{ loading ? t('export.exporting') : t('export.exportPdf') }}</span>
    </div>
    <div v-if="loading" class="loading-spinner">
      <div class="spinner-circle" />
    </div>
  </button>
</template>

<style>
.export-btn {
  @apply flex items-center gap-2 cursor-pointer transition-all duration-300 ease-in-out relative;
}

.export-btn span {
  @apply text-sm font-medium;
}

.export-btn .i-ri-download-2-line {
  @apply text-lg;
}

/* 默认样式 - 用于编辑页面 */
.default-btn {
  @apply fixed z-10 top-2 right-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-gray-700 hover:bg-white hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed;
}

/* 头部样式 - 用于首页 */
.header-btn {
  @apply px-4 py-2 text-sm text-white rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-content {
  @apply flex items-center gap-2;
}

.loading-spinner {
  @apply absolute inset-0 flex items-center justify-center;
}

.spinner-circle {
  @apply w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin;
}

/* 加载状态下的内容样式 */
.is-loading .btn-content {
  @apply opacity-0;
}

/* 头部按钮的加载动画样式 */
.header-btn .spinner-circle {
  @apply border-white border-t-transparent;
}

/* 默认按钮的加载动画样式 */
.default-btn .spinner-circle {
  @apply border-gray-700 border-t-transparent;
}
</style>
