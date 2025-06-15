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
  <div class="bg-gradient-to-br min-h-screen from-gray-50 to-gray-100">
    <!-- Header -->
    <header class="border-b border-gray-200 bg-white">
      <nav class="mx-auto px-4 py-4 max-w-4xl lg:px-8 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-8">
            <h1 class="text-xl text-gray-900 font-semibold">
              Resume Editor
            </h1>
            <div class="hidden space-x-6 md:flex">
              <a href="#editor" class="text-gray-600 hover:text-gray-900">编辑器</a>
              <a href="#guide" class="text-gray-600 hover:text-gray-900">使用指南</a>
              <a href="#templates" class="text-gray-600 hover:text-gray-900">模板</a>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <button class="text-sm text-gray-600 px-4 py-2 hover:text-gray-900">
              保存
            </button>
            <button class="text-sm text-white px-4 py-2 rounded-lg bg-blue-500 transition-colors hover:bg-blue-600">
              导出 PDF
            </button>
          </div>
        </div>
      </nav>
    </header>

    <!-- Hero Section -->
    <section class="border-b border-gray-200 bg-white">
      <div class="mx-auto px-4 py-12 max-w-4xl lg:px-8 sm:px-6">
        <div class="text-center">
          <h2 class="text-3xl text-gray-900 font-bold sm:text-4xl">
            专业的 Markdown 简历编辑器
          </h2>
          <p class="text-lg text-gray-600 mt-4">
            使用 Markdown 轻松创建精美的简历，支持实时预览，一键导出 PDF
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
            快速开始
          </h3>
          <div class="gap-6 grid grid-cols-1 md:grid-cols-3">
            <div class="p-4 rounded-lg bg-gray-50">
              <div class="text-blue-500 font-medium mb-2">
                1. 编辑内容
              </div>
              <p class="text-sm text-gray-600">
                使用 Markdown 语法编写你的简历内容
              </p>
            </div>
            <div class="p-4 rounded-lg bg-gray-50">
              <div class="text-blue-500 font-medium mb-2">
                2. 实时预览
              </div>
              <p class="text-sm text-gray-600">
                右侧实时查看简历效果
              </p>
            </div>
            <div class="p-4 rounded-lg bg-gray-50">
              <div class="text-blue-500 font-medium mb-2">
                3. 导出 PDF
              </div>
              <p class="text-sm text-gray-600">
                一键导出为 PDF 文件
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Editor Section -->
      <section id="editor" class="rounded-2xl bg-white shadow-xl overflow-hidden">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-lg text-gray-900 font-medium">
            编辑简历
          </h2>
          <p class="text-sm text-gray-500 mt-1">
            使用 Markdown 语法编写你的简历
          </p>
        </div>
        <textarea
          v-model="resumeStore.content"
          class="text-sm text-gray-700 font-mono p-6 border-0 h-[400px] w-full focus:ring-0"
          placeholder="Write your resume in Markdown format..."
        />
      </section>

      <!-- Preview Section -->
      <section class="mt-8 rounded-2xl bg-white shadow-xl overflow-hidden">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-lg text-gray-900 font-medium">
            预览效果
          </h2>
          <p class="text-sm text-gray-500 mt-1">
            实时查看简历效果
          </p>
        </div>
        <div class="p-6">
          <div class="max-w-none">
            <MarkdownPreview :content="resumeStore.content" />
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style>
.prose {
  max-width: none;
}
</style>
