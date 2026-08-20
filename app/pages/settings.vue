<script setup lang="ts">
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
        <StorageModeSwitcher />
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
