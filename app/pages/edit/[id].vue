<script setup lang="ts">
import type { EditCodeMirror, EditMarkdownPreview } from '#components'
import { useResumeData } from '~/composables/useResumeData'
import { A4_WIDTH_PX } from '~/utils'

const { currentResume, updateResumeData } = useResumeData()

const el = useTemplateRef('el')
const leftRef = ref<InstanceType<typeof EditCodeMirror>>()
const preRef = ref<InstanceType<typeof EditMarkdownPreview>>()
const { width } = useElementSize(el)

const scalePre = computed(() => {
  return width.value / A4_WIDTH_PX
})

definePageMeta({
  layout: 'default',
  // 不使用全局 sidebase-auth 中间件：本地模式允许匿名访问，database 模式在客户端守卫中跳转
})

// 客户端运行时守卫：database 模式 + 未登录 → 跳回简历列表（那里有登录引导，也可去设置切换本地模式）
const storageManager = useStorageManager()
const { currentMode } = storageManager
const { status } = useAuth()
const router = useRouter()
const localePath = useLocalePath()

function requireAuthIfDatabase() {
  if (import.meta.client && currentMode.value === 'database' && status.value !== 'authenticated') {
    router.push(localePath('resumes'))
  }
}

onMounted(requireAuthIfDatabase)
// 登录态 / 存储模式在页面停留期间发生变化时也重新校验（例如用户打开编辑页后中途退出登录）
watch([currentMode, status], requireAuthIfDatabase)

const { stop, start } = useScrollSync(leftRef, el)

onUnmounted(stop)

// 修复滚动同步控制逻辑
watch(() => currentResume.value?.settings?.isScrollable, (newValue) => {
  if (newValue) {
    start()
  }
  else {
    stop()
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
        <EditCodeMirror
          :model-value="currentResume?.content" :mode="currentResume.settings?.editorMode"
          @update:model-value="currentResume.content = $event"
        />
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
        <ClientOnly>
          <EditMarkdownPreview
            ref="preRef" :content="currentResume?.content" :settings="currentResume?.settings"
            :theme="currentResume?.theme" @update:image-position="(e) => {
              if (currentResume.settings)
                currentResume.settings.imagePosition = e
            }" @update:content="(e) => {
              if (currentResume.content && e)
                currentResume.content = e
            }"
          />
        </ClientOnly>
      </div>
      <ClientOnly>
        <Plugin
          :data="currentResume" :download-img="() => handleExport('png')"
          :download-pdf="() => handleExport('pdf')" @update:data="updateResumeData"
        />
      </ClientOnly>
    </div>
  </div>
</template>
