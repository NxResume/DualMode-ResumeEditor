<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const storageManager = useStorageManager()
const { status, refresh } = useAuth()
const { currentMode, isLoading, error } = storageManager

const PENDING_KEY = '__pending_switch_mode__'

const pendingMode = ref<'local' | 'database' | null>(null)
const showConfirmDialog = ref(false)
// 独立的登录 Dialog（和 AlertDialog 平级，避免嵌套时 Dialog 关闭把 SigninModelItem 带走导致面板出不来）
const showSignInDialog = ref(false)

function handleRequestSwitch(target: 'local' | 'database') {
  if (target === currentMode.value || isLoading.value)
    return
  pendingMode.value = target
  showConfirmDialog.value = true
}

// ========== 登录成功后切模式的双保险 ==========
async function applyPendingModeIfNeeded() {
  if (import.meta.server)
    return
  const raw = localStorage.getItem(PENDING_KEY)
  if (!raw)
    return
  try {
    const target = JSON.parse(raw) as 'local' | 'database'
    if (status.value === 'authenticated' && target === 'database' && target !== currentMode.value)
      await storageManager.switchMode(target)
  }
  finally {
    localStorage.removeItem(PENDING_KEY)
  }
}

onMounted(() => {
  applyPendingModeIfNeeded()
})

// SPA 登录成功（credentials 账号密码）不刷新页面，通过 watch 兜底
// 第三方 OAuth（github 等）会跳转刷新 → onMounted 处理
watch(status, (v, prev) => {
  if (v === 'authenticated' && prev !== 'authenticated')
    applyPendingModeIfNeeded()
})

// 登录 Dialog 关闭回调：无论成功/失败都刷新一下 session 状态
function onSignInClose() {
  showSignInDialog.value = false
  refresh()
}

async function confirmSwitch() {
  const target = pendingMode.value
  if (!target)
    return

  const requiresAuth = target === 'database' && status.value !== 'authenticated'

  showConfirmDialog.value = false
  pendingMode.value = null

  if (requiresAuth) {
    // 持久化：登录成功后切模式（SPA/OAuth 双保险）
    localStorage.setItem(PENDING_KEY, JSON.stringify(target))
    // 等待 AlertDialog DOM 卸载稳定后再打开独立登录 Dialog
    // （避免嵌套在 AlertDialog 内时 SigninModelItem DialogTrigger 与 AlertDialog 关闭顺序冲突，弹不出面板）
    await nextTick()
    showSignInDialog.value = true
    return
  }

  if (target !== currentMode.value)
    await storageManager.switchMode(target)
}

function cancelSwitch() {
  showConfirmDialog.value = false
  pendingMode.value = null
}

const pendingIsLocal = computed(() => pendingMode.value === 'local')
const pendingRequiresAuth = computed(() => pendingMode.value === 'database' && status.value !== 'authenticated')
</script>

<template>
  <div class="storage-mode-switcher space-y-3">
    <!-- 错误提示（若有） -->
    <div v-if="error" class="text-sm text-destructive flex gap-1.5 items-center">
      <i class="i-ri-error-warning-line" />
      {{ error }}
    </div>

    <!-- 与"快速开始"保持一致的双卡片并排布局 -->
    <div class="gap-4 grid sm:grid-cols-2">
      <!-- 本地存储 -->
      <div
        class="p-5 border rounded-xl bg-card flex flex-col gap-3 transition-all"
        :class="currentMode === 'local'
          ? 'border-foreground/40 ring-2 ring-foreground/10 shadow-md'
          : 'hover:border-foreground/30 hover:shadow-md'"
      >
        <div class="flex items-start justify-between">
          <div class="text-foreground flex gap-2 items-center">
            <i class="i-ri-hard-disk-2-line text-xl" />
            <h3 class="text-base font-semibold">
              本地存储
            </h3>
          </div>
          <Badge v-if="currentMode === 'local'" variant="secondary">
            <i class="i-ri-check-line mr-1" />
            当前使用
          </Badge>
        </div>
        <ul class="text-sm text-muted-foreground space-y-1.5">
          <li class="flex gap-1.5 items-start">
            <i class="i-ri-checkbox-circle-line text-green-500 mt-0.5 flex-none" />
            <span><strong>无需登录</strong>，打开即用</span>
          </li>
          <li class="flex gap-1.5 items-start">
            <i class="i-ri-checkbox-circle-line text-green-500 mt-0.5 flex-none" />
            <span>适合本地快速编辑</span>
          </li>
          <li class="flex gap-1.5 items-start">
            <i class="i-ri-information-line text-muted-foreground/80 mt-0.5 flex-none" />
            <span>数据仅保存在当前浏览器 localStorage，清缓存或换设备会丢失</span>
          </li>
        </ul>
        <div class="mt-auto pt-3">
          <Button
            type="button"
            variant="default"
            class="w-full"
            :disabled="currentMode === 'local' || isLoading"
            @click="handleRequestSwitch('local')"
          >
            <template v-if="isLoading && pendingMode === 'local'">
              <i class="i-ri-loader-4-line animate-spin" />
              切换中...
            </template>
            <template v-else-if="currentMode === 'local'">
              <i class="i-ri-check-line" />
              当前使用中
            </template>
            <template v-else>
              <i class="i-ri-hard-disk-2-line" />
              切换到本地存储
            </template>
          </Button>
        </div>
      </div>

      <!-- 云端存储 -->
      <div
        class="p-5 border rounded-xl bg-card flex flex-col gap-3 transition-all"
        :class="currentMode === 'database'
          ? 'border-foreground/40 ring-2 ring-foreground/10 shadow-md'
          : 'hover:border-foreground/30 hover:shadow-md'"
      >
        <div class="flex items-start justify-between">
          <div class="text-foreground flex gap-2 items-center">
            <i class="i-ri-database-2-line text-xl" />
            <h3 class="text-base font-semibold">
              云端存储
            </h3>
          </div>
          <Badge v-if="currentMode === 'database'" variant="secondary">
            <i class="i-ri-check-line mr-1" />
            当前使用
          </Badge>
        </div>
        <ul class="text-sm text-muted-foreground space-y-1.5">
          <li class="flex gap-1.5 items-start">
            <i class="i-ri-checkbox-circle-line text-green-500 mt-0.5 flex-none" />
            <span><strong>跨设备同步</strong>，手机/电脑都能看</span>
          </li>
          <li class="flex gap-1.5 items-start">
            <i class="i-ri-checkbox-circle-line text-green-500 mt-0.5 flex-none" />
            <span>数据安全保存在服务端</span>
          </li>
          <li class="flex gap-1.5 items-start">
            <i class="i-ri-shield-check-line text-muted-foreground/80 mt-0.5 flex-none" />
            <span><strong>需要登录账号</strong>后使用</span>
          </li>
        </ul>
        <div class="mt-auto pt-3">
          <Button
            type="button"
            variant="default"
            class="w-full"
            :disabled="currentMode === 'database' || isLoading"
            @click="handleRequestSwitch('database')"
          >
            <template v-if="isLoading && pendingMode === 'database'">
              <i class="i-ri-loader-4-line animate-spin" />
              切换中...
            </template>
            <template v-else-if="currentMode === 'database'">
              <i class="i-ri-check-line" />
              当前使用中
            </template>
            <template v-else-if="status !== 'authenticated'">
              <i class="i-ri-login-box-line" />
              登录并切换到云端
            </template>
            <template v-else>
              <i class="i-ri-database-2-line" />
              切换到云端存储
            </template>
          </Button>
        </div>
      </div>
    </div>

    <!-- 切换二次确认：两种存储不自动迁移数据 -->
    <AlertDialog v-model:open="showConfirmDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            确认切换到{{ pendingIsLocal ? '本地存储' : '云端存储' }}？
          </AlertDialogTitle>
          <AlertDialogDescription as-child>
            <div class="text-sm space-y-3">
              <div class="p-3 rounded-md bg-muted">
                <p class="font-medium mb-1">
                  重要提示
                </p>
                <ul class="text-muted-foreground list-disc list-inside space-y-0.5">
                  <li>两种存储相互独立，切换后<strong class="text-foreground">不会自动迁移</strong>现有简历数据</li>
                  <li>切换后简历列表将显示目标存储中的内容</li>
                  <li>原模式下的数据仍会保留，切回原模式即可再次查看</li>
                </ul>
              </div>
              <div v-if="pendingIsLocal" class="p-3 border rounded-md bg-muted">
                <p class="font-medium flex gap-1.5 items-center">
                  <i class="i-ri-information-line" />
                  本地存储说明
                </p>
                <p class="text-xs text-muted-foreground mt-1">
                  数据仅保存在当前浏览器 localStorage。清除浏览器数据、更换设备或隐私模式下都会无法访问。
                </p>
              </div>
              <div v-if="pendingRequiresAuth" class="p-3 border rounded-md bg-muted">
                <p class="font-medium flex gap-1.5 items-center">
                  <i class="i-ri-shield-check-line" />
                  云端存储需要登录
                </p>
                <p class="text-xs text-muted-foreground mt-1">
                  点击「确认并登录」后将弹出全局登录面板，<strong>登录成功后</strong>会自动切换到云端存储模式。
                </p>
              </div>
              <p class="text-muted-foreground">
                确认继续吗？
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="cancelSwitch">
            取消
          </AlertDialogCancel>
          <!--
            不把 SigninModelItem 嵌到 AlertDialogAction 里。
            原因：AlertDialog action 默认立即关闭 AlertDialog，会连带卸载 SigninModelItem 里的 DialogTrigger，
            导致 SigninModelItem 自己的登录面板来不及弹出。
            改为：confirmSwitch 先关 AlertDialog → nextTick → 打开和 AlertDialog 平级的独立 showSignInDialog。
          -->
          <AlertDialogAction
            class="text-white bg-black hover:bg-gray-800"
            @click="confirmSwitch"
          >
            <template v-if="pendingRequiresAuth">
              <i class="i-ri-login-box-line" />
              确认并登录
            </template>
            <template v-else>
              确认切换
            </template>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!--
      独立的登录 Dialog（与 AlertDialog 平级，不受 AlertDialog 关闭时的 DOM 卸载影响）
      内容直接嵌入 SigninSocialSignInButtons —— 与 /signin 页面、SigninModelItem 内部使用的完全一致
    -->
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
