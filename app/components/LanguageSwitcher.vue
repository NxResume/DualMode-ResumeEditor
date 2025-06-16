<script setup lang="ts">
const { locale } = useI18n<{ locale: 'en' | 'zh' }>()

const nextLocale = computed(() => locale.value === 'en' ? 'zh' : 'en')
const displayText = computed(() => locale.value === 'en' ? '中' : 'EN')
</script>

<template>
  <NuxtLink :to="$switchLocalePath(nextLocale)" class="language-link">
    {{ displayText }}
  </NuxtLink>
</template>

<style scoped>
.language-link {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.75rem;
  text-decoration: none;
  color: inherit;
  min-width: 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.language-link:hover {
  background: var(--hover-bg);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color, #3b82f6);
}

.language-link:active {
  transform: translateY(0);
  box-shadow: none;
}
</style>
