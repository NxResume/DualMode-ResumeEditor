<script setup lang="ts">
import CodeMirror from '@/components/CodeMirror.vue'
import ExportButton from '@/components/ExportButton.vue'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import { useResumeStore } from '@/stores/resume'
import useSettingsStore from '~/stores/settings'

const settingStore = useSettingsStore()
const resumeStore = useResumeStore()
const el = useTemplateRef('el')
const leftRef = ref<InstanceType<typeof CodeMirror>>()
const previewRef = ref<InstanceType<typeof MarkdownPreview>>()
const { width } = useElementSize(el)

const scalePre = computed(() => {
  return width.value / 794
})

definePageMeta({
  layout: 'default',
})

watch(() => settingStore.isScrollable, () => {
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
    return previewRef.value?.exportToImage()
  }

  return previewRef.value?.exportToPDF()
}
</script>

<template>
  <div class="flex h-full">
    <!-- 左侧编辑器 -->
    <div
      ref="leftRef"
      class="p-2 rounded-lg bg-white flex-none h-full w-480px shadow-lg overflow-x-hidden overflow-y-auto dark:bg-gray-800"
    >
      <ClientOnly>
        <CodeMirror v-model="resumeStore.content" :mode="settingStore.editorMode" />
      </ClientOnly>
    </div>
    <!-- 右侧预览 -->
    <div ref="el" class="px-20 bg-[#606060] flex-shrink flex-grow flex-basis-0 relative overflow-auto">
      <ExportButton variant="default" :on-export="() => handleExport('pdf')" />
      <div
        class="w-full" :style="{
          scale: scalePre || 1,
          transformOrigin: 'top left',
        }"
      >
        <MarkdownPreview ref="previewRef" :content="resumeStore.content" />
      </div>
      <NuxtLink to="/">
        <button class="return-btn">
          <div class="i-ri-arrow-left-line" />
        </button>
      </NuxtLink>
      <ClientOnly>
        <Plugin :download-img="() => handleExport('png')" />
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
.return-btn {
  @apply flex items-center gap-2 px-4 py-2.5;
  @apply fixed z-10 top-0 left-34% rounded-md;
  @apply text-white backdrop-blur-sm cursor-pointer transition-all duration-300 ease-in-out;
  @apply hover:scale-110;
}

.return-btn span {
  @apply text-sm font-medium;
}

.return-btn .i-ri-arrow-left-line {
  @apply text-lg;
}
</style>
