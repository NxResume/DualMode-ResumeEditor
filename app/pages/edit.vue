<script setup lang="ts">
import CodeMirror from '@/components/CodeMirror.vue'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import { useResumeStore } from '@/stores/resume'

const el = useTemplateRef('el')
const { width } = useElementSize(el)

const scalePre = computed(() => {
  return width.value / 794
})

definePageMeta({
  layout: 'default',
})

const resumeStore = useResumeStore()

// const editorModes = [
//   { label: '源码模式', value: 'source' as const },
//   { label: '混合模式', value: 'mixed' as const },
// ] as const

const currentMode = ref<'source' | 'mixed'>('source')
</script>

<!-- <div class="mb-4 flex items-center justify-between">
  <div class="flex gap-2 items-center">
    <button
      v-for="mode in editorModes" :key="mode.value" class="px-3 py-1 rounded"
      :class="currentMode === mode.value ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'"
      @click="currentMode = mode.value"
    >
      {{ mode.label }}
    </button>
  </div>
</div> -->
<template>
  <div class="flex h-[calc(100%-73px)]">
    <!-- 左侧编辑器 -->
    <div class="p-2 rounded-lg bg-white flex-none h-full w-480px shadow-lg overflow-x-hidden overflow-y-auto dark:bg-gray-800">
      <CodeMirror v-model="resumeStore.content" :mode="currentMode" />
    </div>
    <!-- 右侧预览 -->
    <div ref="el" class="px-20 bg-[#606060] flex-shrink flex-grow flex-basis-0 overflow-auto">
      <div
        class="w-full"
        :style="{
          scale: scalePre || 1,
          transformOrigin: 'top left',
        }"
      >
        <MarkdownPreview :content="resumeStore.content" />
      </div>
    </div>
  </div>
</template>
