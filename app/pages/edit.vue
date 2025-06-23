<script setup lang="ts">
import type { MarkdownPreview } from '#components'
import CodeMirror from '@/components/CodeMirror.vue'
import { useResumeStore } from '@/stores/resume'
import useSettingsStore from '~/stores/settings'

const settingStore = useSettingsStore()
const resumeStore = useResumeStore()
const el = useTemplateRef('el')
const leftRef = ref<InstanceType<typeof CodeMirror>>()
const preRef = ref<InstanceType<typeof MarkdownPreview>>()
const { width } = useElementSize(el)

const scalePre = computed(() => {
  return width.value / 794
})

definePageMeta({
  layout: 'default',
})

// app/pages/edit.vue
watch(() => [settingStore.isScrollable, settingStore.editorMode], () => {
  if (settingStore.isScrollable) {
    const stop = useScrollSync(leftRef, el)
    watch(() => settingStore.isScrollable, (newValue) => {
      if (!newValue) {
        stop()
      }
    })
  }
}, {
  immediate: true,
})

async function handleExport(type: 'pdf' | 'png') {
  if (type === 'png') {
    return preRef.value?.exportToImage()
  }

  return preRef.value?.exportToPDF()
}
</script>

<template>
  <div class="flex h-full">
    <!-- 左侧编辑器 -->
    <div
      ref="leftRef"
      class="p-2 pt-10 rounded-lg bg-white flex-none h-full w-480px shadow-lg overflow-x-hidden overflow-y-auto dark:bg-gray-800"
    >
      <ClientOnly>
        <CodeMirror v-model="resumeStore.content" :mode="settingStore.editorMode" />
      </ClientOnly>
    </div>
    <!-- 右侧预览 -->
    <div ref="el" class="px-20 pt-2 bg-[#606060] flex-shrink flex-grow flex-basis-0 relative overflow-auto">
      <div
        class="w-full" :style="{
          scale: scalePre || 1,
          transformOrigin: 'top left',
        }"
      >
        <MarkdownPreview ref="preRef" :content="resumeStore.content" />
      </div>
      <ClientOnly>
        <Plugin :download-img="() => handleExport('png')" :download-pdf="() => handleExport('pdf')" />
      </ClientOnly>
    </div>
  </div>
</template>
