<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import Toaster from '~/components/ui/toast/Toaster.vue'

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
    <Toaster />
    <main class="h-full">
      <slot />
    </main>
  </div>
</template>
