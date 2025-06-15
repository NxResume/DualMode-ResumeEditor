<script setup lang="ts">
import CodeMirror from '@/components/CodeMirror.vue'
import ExportButton from '@/components/ExportButton.vue'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import { useResumeStore } from '@/stores/resume'

const el = useTemplateRef('el')
const previewRef = ref<InstanceType<typeof MarkdownPreview>>()
const { width } = useElementSize(el)

const scalePre = computed(() => {
  return width.value / 794
})

definePageMeta({
  layout: 'default',
})

const resumeStore = useResumeStore()

const currentMode = ref<'source' | 'mixed'>('source')

async function handleExport() {
  return previewRef.value?.exportToPDF()
}
</script>

<template>
  <div class="flex h-full">
    <!-- 左侧编辑器 -->
    <div class="p-2 rounded-lg bg-white flex-none h-full w-480px shadow-lg overflow-x-hidden overflow-y-auto dark:bg-gray-800">
      <CodeMirror v-model="resumeStore.content" :mode="currentMode" />
    </div>
    <!-- 右侧预览 -->
    <div ref="el" class="px-20 bg-[#606060] flex-shrink flex-grow flex-basis-0 relative overflow-auto">
      <ExportButton
        variant="default"
        :on-export="handleExport"
      />
      <div
        class="w-full"
        :style="{
          scale: scalePre || 1,
          transformOrigin: 'top left',
        }"
      >
        <MarkdownPreview ref="previewRef" :content="resumeStore.content" />
      </div>
      <NuxtLink to="/">
        <button class="return-btn">
          <div class="i-ri-arrow-left-line" />
          <span>返回</span>
        </button>
      </NuxtLink>
    </div>
  </div>
</template>

<style>
.return-btn {
  @apply fixed z-10 bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-gray-700 cursor-pointer transition-all duration-300 ease-in-out hover:bg-white hover:shadow-xl hover:scale-105;
}

.return-btn span {
  @apply text-sm font-medium;
}

.return-btn .i-ri-arrow-left-line {
  @apply text-lg;
}
</style>
