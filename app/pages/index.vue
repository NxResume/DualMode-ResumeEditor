<script setup lang="ts">
import testMd from '@/pages/test.md?raw'
import { useResumeStore } from '@/stores/resume'
import MarkdownPreview from '~/components/MarkdownPreview.vue'

definePageMeta({
  layout: 'default',
})

const resumeStore = useResumeStore()

// 初始化简历内容
if (!resumeStore.content) {
  resumeStore.setContent(testMd)
}
</script>

<template>
  <div class="mx-auto h-[88%] max-w-[794px] shadow-2xl">
    <MarkdownPreview :content="resumeStore.content" />
  </div>
</template>
