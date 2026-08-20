<script setup lang="ts">
// 组件放在 app/components/settings/ 子目录，Nuxt 自动导入会拼出
// SettingsStorageModeSwitcher 的名字，不便于使用，因此显式导入原名
import StorageModeSwitcher from '@/components/settings/StorageModeSwitcher.vue'

definePageMeta({
  title: '设置',
})
</script>

<template>
  <div class="mx-auto p-6 container">
    <h1 class="text-2xl font-bold mb-6">
      设置
    </h1>

    <div class="space-y-6">
      <!-- 存储模式设置 -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold mb-4">
          存储设置
        </h2>
        <!-- 存储模式依赖 localStorage（仅客户端存在），必须包 ClientOnly
             避免 SSR hydrate mismatch 导致整块不渲染 -->
        <ClientOnly>
          <StorageModeSwitcher />
          <template #fallback>
            <div class="space-y-3">
              <div class="rounded bg-muted h-4 w-24 animate-pulse" />
              <div class="p-0.5 border border-input rounded-md bg-background h-9 w-64 animate-pulse" />
              <div class="rounded bg-muted h-4 w-48 animate-pulse" />
            </div>
          </template>
        </ClientOnly>
      </div>

      <!-- 其他设置可以在这里添加 -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold mb-4">
          其他设置
        </h2>
        <p class="text-muted-foreground">
          更多设置选项将在这里添加...
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  @apply bg-card border rounded-lg;
}
</style>
