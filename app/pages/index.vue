<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

// 组件放在 home/ 子目录下，Nuxt 自动导入会把一级目录拼为前缀 HomeQuickStartDialog，
// 故显式导入，避免猜测自动导入名
import QuickStartDialog from '@/components/home/QuickStartDialog.vue'
</script>

<template>
  <div class="min-h-screen from-gray-50 to-gray-100 bg-linear-to-br">
    <!-- Header -->
    <HomeHeader />

    <!-- Hero Section -->
    <section class="border-b border-gray-200 bg-white">
      <div class="mx-auto px-4 py-12 max-w-4xl lg:px-8 sm:px-6">
        <div class="text-center">
          <h2 class="text-3xl text-gray-900 font-bold font-serif sm:text-4xl">
            {{ $t('app.title') }}
          </h2>
          <p class="text-lg text-gray-600 mt-4">
            {{ $t('app.description') }}
          </p>

          <!-- 快速开始：点击先弹存储选择引导（本地=免登录，云端=需登录） -->
          <QuickStartDialog />
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <main class="mx-auto py-8">
      <!-- Template Explanation Section -->
      <HomeTemplateExplanation />

      <!-- Features Section -->
      <HomeFeatures />

      <HomeFAQ />
    </main>

    <HomeFooterSection />
  </div>
</template>
