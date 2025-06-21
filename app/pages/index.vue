<script setup lang="ts">
import { useResumeStore } from '@/stores/resume'

const previewRef = ref()
const previewEl = useTemplateRef('previewEl')
const { locale } = useI18n<{ locale: 'en' | 'zh' }>()

definePageMeta({
  layout: 'default',
})

const resumeStore = useResumeStore()

const editPath = computed(() => {
  return locale.value === 'en' ? '/en/edit' : '/edit'
})

const { enter, isFullscreen } = useFullscreen(previewEl)
async function handleExport() {
  return previewRef.value?.exportToPDF()
}
</script>

<template>
  <div class="bg-gradient-to-br min-h-screen from-gray-50 to-gray-100">
    <!-- Header -->
    <header class="border-b border-gray-200 bg-white">
      <nav class="mx-auto px-4 py-4 max-w-4xl lg:px-8 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-8">
            <h1 class="text-xl text-gray-900 font-semibold">
              {{ $t('app.title') }}
            </h1>
            <div class="hidden space-x-6 md:flex">
              <a href="#editor" class="text-gray-600 hover:text-gray-900">{{ $t('nav.editor') }}</a>
              <a href="#guide" class="text-gray-600 hover:text-gray-900">{{ $t('nav.guide') }}</a>
              <a href="#templates" class="text-gray-600 hover:text-gray-900">{{ $t('nav.templates') }}</a>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <NuxtLink :to="editPath">
              <button class="text-sm text-gray-600 px-4 py-2 cursor-pointer hover:text-gray-900">
                {{ $t('nav.editor') }}
              </button>
            </NuxtLink>
            <ExportButton
              variant="header"
              :on-export="handleExport"
            />
          </div>
        </div>
      </nav>
    </header>

    <!-- Hero Section -->
    <section class="border-b border-gray-200 bg-white">
      <div class="mx-auto px-4 py-12 max-w-4xl lg:px-8 sm:px-6">
        <div class="text-center">
          <h2 class="text-3xl text-gray-900 font-bold sm:text-4xl">
            {{ $t('app.title') }}
          </h2>
          <p class="text-lg text-gray-600 mt-4">
            {{ $t('app.description') }}
          </p>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <main class="mx-auto px-4 py-8 max-w-4xl lg:px-8 sm:px-6">
      <!-- Quick Guide -->
      <section id="guide" class="mb-12">
        <div class="p-6 rounded-2xl bg-white shadow-sm">
          <h3 class="text-lg text-gray-900 font-medium mb-4">
            {{ $t('guide.title') }}
          </h3>
          <div class="gap-6 grid grid-cols-1 md:grid-cols-3">
            <div class="p-4 rounded-lg bg-gray-50">
              <div class="text-blue-500 font-medium mb-2">
                {{ $t('guide.step1') }}
              </div>
              <p class="text-sm text-gray-600">
                {{ $t('guide.step1Desc') }}
              </p>
            </div>
            <div class="p-4 rounded-lg bg-gray-50">
              <div class="text-blue-500 font-medium mb-2">
                {{ $t('guide.step2') }}
              </div>
              <p class="text-sm text-gray-600">
                {{ $t('guide.step2Desc') }}
              </p>
            </div>
            <div class="p-4 rounded-lg bg-gray-50">
              <div class="text-blue-500 font-medium mb-2">
                {{ $t('guide.step3') }}
              </div>
              <p class="text-sm text-gray-600">
                {{ $t('guide.step3Desc') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Editor Section -->
      <section id="editor" class="rounded-2xl bg-white shadow-xl relative overflow-hidden">
        <div class="card-wrapper">
          <div>
            <h2 class="text-lg text-gray-900 font-medium">
              {{ $t('editor.title') }}
            </h2>
            <p class="text-sm text-gray-500 mt-1">
              {{ $t('editor.description') }}
            </p>
          </div>
          <NuxtLink :to="editPath" class="flex items-center justify-center">
            <div class="i-ri-edit-box-line icon-btn" />
          </NuxtLink>
        </div>
        <textarea
          v-model="resumeStore.content"
          class="text-sm text-gray-700 font-mono p-6 border-0 h-[400px] w-full focus:ring-0"
          placeholder="Write your resume in Markdown format..."
        />
      </section>

      <!-- Preview Section -->
      <section class="mt-8 rounded-2xl bg-white shadow-xl overflow-hidden">
        <div class="card-wrapper">
          <div>
            <h2 class="text-lg text-gray-900 font-medium">
              {{ $t('editor.preview') }}
            </h2>
            <p class="text-sm text-gray-500 mt-1">
              {{ $t('editor.previewDesc') }}
            </p>
          </div>
          <div class="i-ri-fullscreen-line icon-btn" @click="enter" />
        </div>
        <div
          ref="previewEl" class="p-6"
          :class="{
            'overflow-auto h-full': isFullscreen,
          }"
        >
          <div class="max-w-none">
            <MarkdownPreview ref="previewRef" :content="resumeStore.content" />
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.card-wrapper {
  @apply p-6 border-b border-gray-200 flex items-center justify-between;
}
</style>
