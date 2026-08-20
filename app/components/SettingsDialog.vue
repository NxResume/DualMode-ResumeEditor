<script setup lang="ts">
// 注意：组件放在 app/components/settings/ 子目录，Nuxt 自动导入会拼出
// SettingsStorageModeSwitcher 的名字，不便于使用，因此显式导入原名
import StorageModeSwitcher from '@/components/settings/StorageModeSwitcher.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
</script>

<template>
  <Dialog>
    <!-- 触发器：放在 Header 导航栏的设置按钮（仅首页可见） -->
    <DialogTrigger as-child>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="设置"
        title="设置"
        class="rounded-md"
      >
        <i class="i-ri-settings-3-line" />
      </Button>
    </DialogTrigger>

    <!-- 双卡片布局需要更宽的弹窗宽度（与快速开始一致） -->
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>存储设置</DialogTitle>
        <DialogDescription>
          选择您的简历数据存储方式。两种存储相互独立，可随时切换。
        </DialogDescription>
      </DialogHeader>

      <div class="pt-2">
        <!-- 存储模式依赖 localStorage（仅客户端存在），必须包 ClientOnly
             避免 SSR hydrate mismatch 导致整块不渲染 -->
        <ClientOnly>
          <StorageModeSwitcher />
          <template #fallback>
            <div class="gap-4 grid sm:grid-cols-2">
              <div class="p-5 border rounded-xl space-y-3">
                <div class="rounded bg-muted h-6 w-28 animate-pulse" />
                <div class="space-y-1.5">
                  <div class="rounded bg-muted h-4 w-full animate-pulse" />
                  <div class="rounded bg-muted h-4 w-11/12 animate-pulse" />
                  <div class="rounded bg-muted h-4 w-10/12 animate-pulse" />
                </div>
                <div class="mt-4 rounded-md bg-muted h-10 w-full animate-pulse" />
              </div>
              <div class="p-5 border rounded-xl space-y-3">
                <div class="rounded bg-muted h-6 w-28 animate-pulse" />
                <div class="space-y-1.5">
                  <div class="rounded bg-muted h-4 w-full animate-pulse" />
                  <div class="rounded bg-muted h-4 w-11/12 animate-pulse" />
                  <div class="rounded bg-muted h-4 w-10/12 animate-pulse" />
                </div>
                <div class="mt-4 rounded-md bg-muted h-10 w-full animate-pulse" />
              </div>
            </div>
          </template>
        </ClientOnly>
      </div>
    </DialogContent>
  </Dialog>
</template>
