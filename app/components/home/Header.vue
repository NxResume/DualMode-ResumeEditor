<script setup lang="ts">
const navLinks = [
  { label: 'nav.resumeTemplates', href: '#templates' },
  { label: 'nav.faq', href: '#faq' },
]
</script>

<template>
  <header class="border-b border-gray-100 bg-white/90 shadow-sm top-0 sticky z-50 backdrop-blur-sm">
    <nav class="mx-auto px-8 py-3 flex items-center justify-between">
      <!-- 左侧 Logo 和标题 -->
      <div class="flex gap-3 items-center">
        <img src="/nuxt.svg" alt="Logo" class="h-8 w-8">
        <h1 class="text-xl text-gray-900 tracking-tight font-bold">
          {{ $t('app.title') }}
        </h1>
      </div>

      <!-- 右侧导航链接 -->
      <ul class="text-sm font-medium gap-6 hidden items-center md:flex">
        <li v-for="(item, idx) in navLinks" :key="idx">
          <a
            :href="item.href"
            class="text-gray-600 transition-colors duration-200 relative hover:text-black"
          >
            {{ $t(item.label) }}
            <span
              class="bg-black h-[2px] w-0 transition-all duration-300 left-0 absolute group-hover:w-full -bottom-1"
            />
          </a>
        </li>
        <li class="nuxt-btn-link">
          <LanguageSwitcher />
        </li>
        <li class="nuxt-btn-link">
          <NuxtLink to="https://github.com/NxResume/nuxt-resume-editor" target="_blank">
            <div class="i-ri-github-line" />
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
.nuxt-btn-link {
  @apply cursor-pointer hover:scale-105;
}
</style>
