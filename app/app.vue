<script setup lang="ts">
import { appName } from '~/constants'

const storageManager = useStorageManager()

useHead({
  title: appName,
})

// 同步初始化存储模式（不能放 onMounted：子组件 onMounted 先于父组件跑，
// 编辑页 fetchCurrentResume 会用了错误的 provider 查远端，导致数据为空）
storageManager.initializeMode()
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
