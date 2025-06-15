<script setup lang="ts">
</script>

<template>
  <div class="h-100vh relative">
    <main class="h-full">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.edit {
  @apply bottom-20 right-6 fixed z-99;
  @apply text-white px-4 py-2 rounded-lg bg-blue-600 inline-flex transform transition-all duration-200 items-center hover:bg-blue-700 hover:scale-105;
}
</style>
