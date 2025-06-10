<script setup lang="ts">
const colorMode = useColorMode()

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="h-100vh overflow-hidden">
    <header class="border-b border-gray-200 dark:border-gray-800">
      <div class="mx-auto px-4 py-4 flex items-center justify-between">
        <NuxtLink to="/" class="text-xl font-bold flex gap-2 items-center">
          <i class="fas fa-file-alt text-blue-600" />
          Resume Editor
        </NuxtLink>
        <div class="flex gap-4 items-center">
          <NuxtLink
            to="/edit"
            class="text-white px-4 py-2 rounded-lg bg-blue-600 inline-flex transform transition-all duration-200 items-center hover:bg-blue-700 hover:scale-105"
          >
            <i class="fas fa-edit mr-2" />
            编辑简历
          </NuxtLink>
          <button
            class="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            @click="toggleColorMode"
          >
            <i class="fas fa-moon dark:hidden" />
            <i class="fas fa-sun hidden dark:block" />
          </button>
        </div>
      </div>
    </header>
    <main class="h-full">
      <slot />
    </main>
  </div>
</template>
