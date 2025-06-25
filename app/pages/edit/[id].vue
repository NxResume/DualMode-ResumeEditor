<script setup lang="ts">
import type { MarkdownPreview } from '#components'
import CodeMirror from '@/components/CodeMirror.vue'
import { useResumeStore } from '@/stores/resume'
import { useResumeSettingsStore } from '~/stores/resumeSettings'

const route = useRoute()
const router = useRouter()
const resumeStore = useResumeStore()

// 根据路由参数切换简历
const resumeId = (route.params as Record<string, any>)?.id as string | undefined
if (resumeId && resumeStore.currentResumeId !== resumeId) {
  resumeStore.switchResume(resumeId)
}

// 如果简历不存在，重定向到简历列表
if (!resumeStore.currentResume) {
  router.push('/resumes')
}

const resumeSettingsStore = useResumeSettingsStore()
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

// 监听路由变化，切换简历
watch(() => (route.params as Record<string, any>)?.id, (newId) => {
  if (typeof newId === 'string') {
    resumeStore.switchResume(newId)
  }
})

const { stop, start } = useScrollSync(leftRef, el)

onMounted(start)
onUnmounted(stop)

// app/pages/edit/[id].vue
watch(() => [resumeSettingsStore.currentSettings.isScrollable, resumeSettingsStore.currentSettings.editorMode], () => {
  if (resumeSettingsStore.currentSettings.isScrollable) {
    watch(() => resumeSettingsStore.currentSettings.isScrollable, (newValue) => {
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
        <CodeMirror v-model="resumeStore.content" :mode="resumeSettingsStore.currentSettings.editorMode" />
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
