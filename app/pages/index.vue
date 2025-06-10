<script setup lang="ts">
import { useResumeStore } from '@/stores/resume'
import MarkdownPreview from '~/components/MarkdownPreview.vue'

definePageMeta({
  layout: 'default',
})

const resumeStore = useResumeStore()

// 初始化简历内容
if (!resumeStore.content) {
  resumeStore.setContent('')
}
</script>

<template>
  <div class="mx-auto max-w-[794px]">
    <div class="p-8 rounded-lg bg-white shadow-lg dark:bg-gray-800">
      <MarkdownPreview :content="resumeStore.content" />
    </div>
  </div>
</template>
