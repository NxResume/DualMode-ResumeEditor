<script setup lang="ts">
const colorMode = useColorMode()

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <button class="theme-switcher" @click="toggleTheme">
    <div v-if="colorMode.value === 'dark'" class="i-ri-sun-line" />
    <div v-else class="i-ri-moon-line" />
  </button>
</template>

<style scoped>
.theme-switcher {
  padding: 0.25rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
}

.theme-switcher:hover {
  background: var(--hover-bg);
}
</style>
