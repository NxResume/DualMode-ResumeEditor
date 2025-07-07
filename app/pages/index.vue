<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const localePath = useLocalePath()
const isDev = import.meta.dev
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

          <NuxtLink :to="localePath('resumes')">
            <div
              class="text-lg text-white leading-[48px] font-semibold mx-auto mt-10 text-center rounded-4xl h-12 w-40 cursor-pointer select-none shadow-md transition-all duration-500 from-black to-gray-700 bg-linear-to-r hover:shadow-xl hover:scale-105"
            >
              {{ $t('app.startButton') }}
            </div>
          </NuxtLink>
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

    <!-- 开发模式下的测试链接 -->
    <div v-if="isDev" class="bottom-4 right-4 fixed z-50">
      <div class="text-white p-4 rounded-lg bg-blue-500 shadow-lg">
        <h3 class="font-semibold mb-2">
          {{ $t('devTools') }}
        </h3>
        <div class="space-y-2">
          <NuxtLink
            to="/settings"
            class="text-sm block hover:underline"
          >
            ⚙️ {{ $t('settingsPage') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
