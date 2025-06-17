<script setup lang="ts">
const { locale } = useI18n<{ locale: 'en' | 'zh' }>()

const nextLocale = computed(() => locale.value === 'en' ? 'zh' : 'en')
const displayText = computed(() => locale.value === 'en' ? '中' : 'EN')
</script>

<template>
  <NuxtLink :to="$switchLocalePath(nextLocale)" class="nuxt-btn-link">
    {{ displayText }}
  </NuxtLink>
</template>
