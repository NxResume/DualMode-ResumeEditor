<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const storageManager = useStorageManager()
const { status, refresh } = useAuth()
const { currentMode, isLoading } = storageManager

// 登录成功后切云端模式的双保险（SPA 登录不刷新页面，OAuth 刷新走 onMounted）
const PENDING_KEY = '__pending_switch_mode__'

// 未登录切云端时弹出的登录 Dialog
const showSignInDialog = ref(false)

const isCloud = computed(() => currentMode.value === 'database')

function applyPendingModeIfNeeded() {
  if (import.meta.server)
    return
  const raw = localStorage.getItem(PENDING_KEY)
  if (!raw)
    return
  try {
    const target = JSON.parse(raw) as 'local' | 'database'
    if (status.value === 'authenticated' && target === 'database' && target !== currentMode.value)
      storageManager.switchMode(target)
  }
  finally {
    localStorage.removeItem(PENDING_KEY)
  }
}

onMounted(() => {
  applyPendingModeIfNeeded()
})

// SPA 登录成功（credentials 账号密码）不刷新页面，通过 watch 兜底
watch(status, (v, prev) => {
  if (v === 'authenticated' && prev !== 'authenticated')
    applyPendingModeIfNeeded()
})

// 登录 Dialog 关闭回调：无论成功/失败都刷新一下 session 状态
function onSignInClose() {
  showSignInDialog.value = false
  refresh()
}

// 切换：false = 本地，true = 云端
async function onToggle(checked: boolean) {
  if (isLoading.value)
    return
  const target = checked ? 'database' : 'local'
  if (target === currentMode.value)
    return

  // 切到云端但未登录 → 持久化意图，弹登录面板，登录成功后自动切换
  if (target === 'database' && status.value !== 'authenticated') {
    localStorage.setItem(PENDING_KEY, JSON.stringify(target))
    showSignInDialog.value = true
    return
  }

  await storageManager.switchMode(target)
}
</script>

<template>
  <div class="flex gap-2 items-center">
    <!-- 分段开关：直角长方形外观，滑块覆盖当前选中项 -->
    <div
      class="text-xs font-medium p-0.5 rounded-[4px] bg-muted flex flex-none h-7 w-32 select-none items-center relative"
      role="group"
      aria-label="存储模式"
    >
      <!-- 滑块：覆盖当前选中项，位置用内联 style transform 控制
           （不用 CSS 类控制位置——hydration 时 SSR 与客户端状态不一致会导致 patch 被跳过） -->
      <span
        class="rounded-[4px] bg-background shadow-sm transition-transform duration-200 ease-in-out inset-y-0.5 left-0.5 absolute"
        :style="{
          right: '50%',
          transform: isCloud ? 'translateX(100%)' : 'translateX(0)',
        }"
      />
      <!-- 本地 -->
      <button
        type="button"
        class="py-0.5 text-center rounded-full flex-1 cursor-pointer transition-colors relative z-10"
        :style="{ color: isCloud ? 'var(--muted-foreground)' : 'var(--foreground)' }"
        :disabled="isLoading"
        @click="onToggle(false)"
      >
        本地
      </button>
      <!-- 云端 -->
      <button
        type="button"
        class="py-0.5 text-center rounded-full flex-1 cursor-pointer transition-colors relative z-10"
        :style="{ color: isCloud ? 'var(--foreground)' : 'var(--muted-foreground)' }"
        :disabled="isLoading"
        @click="onToggle(true)"
      >
        云端
      </button>
    </div>

    <!-- 切云端未登录时弹出的登录 Dialog -->
    <Dialog v-model:open="showSignInDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="text-lg">
            登录账号以使用云端存储
          </DialogTitle>
        </DialogHeader>
        <div class="pt-2">
          <SigninSocialSignInButtons :callback="onSignInClose" />
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
