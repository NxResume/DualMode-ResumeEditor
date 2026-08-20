<script setup lang="ts">
import { appName } from '~/constants'

const storageManager = useStorageManager()

useHead({
  title: appName,
})

// 应用启动时初始化存储模式（从 localStorage 恢复用户选择）
onMounted(() => {
  storageManager.initializeMode()
})
</script>

<template>
  <VitePwaManifest />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
html,
body,
#__nuxt {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}

html.dark {
  color-scheme: dark;
}
</style>
