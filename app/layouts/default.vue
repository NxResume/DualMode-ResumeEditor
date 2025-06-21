<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const routes = useRoute()
const { t, locale } = useI18n()

useSeoMeta({
  description: t('app.description'),
  ogTitle: t('app.title'),
  ogDescription: t('app.description'),
  ogImage: '/og-image.png',
  ogUrl: 'https://resume.ryanuo.cc',
  twitterTitle: t('app.title'),
  twitterDescription: t('app.description'),
  twitterImage: '/og-image.png',
  twitterCard: 'summary_large_image',
})

useHead({
  htmlAttrs: {
    lang: locale.value,
  },
  link: [
    { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
  ],
})

onMounted(() => {
  watchEffect(() => {
    if (import.meta.client) {
      const isEdit = routes.path.includes('/edit')
      document.documentElement.style.setProperty('--nuxt-btn-link', isEdit ? '#fff' : '#000')
    }
  })
})
</script>

<template>
  <div class="h-100vh relative">
    <main class="h-full">
      <slot />
    </main>
    <div class="flex flex-col gap-2 bottom-4 right-4 fixed z-50">
      <LanguageSwitcher />
      <!-- <ThemeSwitcher /> -->
      <NuxtLink to="https://github.com/NxResume/nuxt-resume-editor" target="_blank" class="nuxt-btn-link">
        <div class="i-ri-github-line" />
      </NuxtLink>
    </div>
  </div>
</template>

<style>
.nuxt-btn-link {
  color: var(--nuxt-btn-link, #000);
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.85rem;
  text-decoration: none;
  min-width: 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.nuxt-btn-link:hover {
  background: var(--hover-bg);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color, #3b82f6);
}

.nuxt-btn-link:active {
  transform: translateY(0);
  box-shadow: none;
}
</style>
