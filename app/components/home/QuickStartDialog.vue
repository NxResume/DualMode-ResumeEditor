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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useStorageManager } from '~/composables/useStorageManager'

const storageManager = useStorageManager()
const { status, refresh } = useAuth()
const router = useRouter()
const localePath = useLocalePath()

// 目标模式持久化 key：登录成功（SPA/OAuth 刷新）后恢复意图
const PENDING_KEY_MODE = '__pending_qs_mode__'
const PENDING_KEY_ACTION = '__pending_qs_action__'

const dialogOpen = ref(false)

// ---------- 二次确认 ----------
const pendingMode = ref<'local' | 'database' | null>(null)
const showConfirmDialog = ref(false)
// 独立的登录 Dialog（不嵌套在 AlertDialog 里，避免被 AlertDialog 关闭时卸载）
const showSignInDialog = ref(false)

const pendingIsLocal = computed(() => pendingMode.value === 'local')
const pendingRequiresAuth = computed(() => pendingMode.value === 'database' && status.value !== 'authenticated')

function handleRequestStart(target: 'local' | 'database') {
  pendingMode.value = target
  showConfirmDialog.value = true
}

function cancelConfirm() {
  showConfirmDialog.value = false
  pendingMode.value = null
}

function goResumes() {
  dialogOpen.value = false
  showConfirmDialog.value = false
  pendingMode.value = null
  router.push(localePath('resumes'))
}

// ========== 登录成功后继续流程的双保险 ==========
async function applyPendingActionIfNeeded() {
  if (import.meta.server)
    return
  const rawMode = localStorage.getItem(PENDING_KEY_MODE)
  const rawAction = localStorage.getItem(PENDING_KEY_ACTION)
  if (!rawMode || rawAction !== 'goResumes')
    return
  try {
    const target = JSON.parse(rawMode) as 'local' | 'database'
    if (target === 'database') {
      // 云端：必须登录成功才切并跳转
      if (status.value === 'authenticated') {
        if (storageManager.currentMode.value !== 'database')
          await storageManager.switchMode('database')
        showSignInDialog.value = false
        router.push(localePath('resumes'))
      }
    }
  }
  finally {
    localStorage.removeItem(PENDING_KEY_MODE)
    localStorage.removeItem(PENDING_KEY_ACTION)
  }
}

onMounted(() => {
  applyPendingActionIfNeeded()
})

// SPA 内登录成功的回调（不刷新页面的登录方式，如 credentials）
watch(status, (v, prev) => {
  if (v === 'authenticated' && prev !== 'authenticated')
    applyPendingActionIfNeeded()
})

// 账号密码登录成功时的回调（OAuth 会刷新页面，不走这个）
function onSignInClose() {
  showSignInDialog.value = false
  refresh()
}

async function confirmStart() {
  const target = pendingMode.value
  if (!target)
    return

  if (target === 'local') {
    if (storageManager.currentMode.value !== 'local')
      await storageManager.switchMode('local')
    goResumes()
    return
  }

  // database 分支
  if (status.value === 'authenticated') {
    // 已登录 → 直接切模式并跳转
    if (storageManager.currentMode.value !== 'database')
      await storageManager.switchMode('database')
    goResumes()
    return
  }

  // 未登录：持久化意图 → 关 AlertDialog + QuickStart Dialog → nextTick → 开独立登录 Dialog
  // （SigninModelItem 嵌在 AlertDialog 里会被其关闭时卸载，导致登录面板弹不出来，所以改成独立 Dialog）
  localStorage.setItem(PENDING_KEY_MODE, JSON.stringify(target))
  localStorage.setItem(PENDING_KEY_ACTION, JSON.stringify('goResumes'))

  showConfirmDialog.value = false
  dialogOpen.value = false
  pendingMode.value = null

  await nextTick()
  showSignInDialog.value = true
}
</script>

<template>
  <ClientOnly>
    <Dialog v-model:open="dialogOpen">
      <DialogTrigger as-child>
        <!-- 与原项目「快速开始」按钮完全一致的黑灰渐变主 CTA 色 —— 保持主题统一 -->
        <div
          class="text-lg text-white leading-[48px] font-semibold mx-auto mt-10 text-center rounded-4xl h-12 w-40 cursor-pointer select-none shadow-md transition-all duration-500 from-black to-gray-700 bg-linear-to-r hover:shadow-xl hover:scale-105"
        >
          {{ $t('app.startButton') }}
        </div>
      </DialogTrigger>

      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle class="text-xl">
            选择存储方式开始使用
          </DialogTitle>
          <DialogDescription>
            两种存储模式相互独立，可随时在右上角 ⚙️ 设置中切换。
          </DialogDescription>
        </DialogHeader>

        <div class="pt-2 gap-4 grid sm:grid-cols-2">
          <!-- 本地存储 -->
          <div class="p-5 border rounded-xl bg-card flex flex-col gap-3 transition-all hover:border-foreground/30 hover:shadow-md">
            <div class="text-foreground flex gap-2 items-center">
              <i class="i-ri-hard-disk-2-line text-xl" />
              <h3 class="text-lg font-semibold">
                本地存储
              </h3>
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
                <span>数据仅保存在当前浏览器的 localStorage，清缓存/换设备会丢失</span>
              </li>
            </ul>
            <div class="mt-auto pt-3">
              <Button
                type="button"
                size="lg"
                variant="default"
                class="w-full"
                @click="handleRequestStart('local')"
              >
                <i class="i-ri-hard-disk-2-line" />
                无需登录，开始使用
              </Button>
            </div>
          </div>

          <!-- 云端存储 -->
          <div class="p-5 border rounded-xl bg-card flex flex-col gap-3 transition-all hover:border-foreground/30 hover:shadow-md">
            <div class="text-foreground flex gap-2 items-center">
              <i class="i-ri-database-2-line text-xl" />
              <h3 class="text-lg font-semibold">
                云端存储
              </h3>
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
                size="lg"
                variant="default"
                class="w-full"
                @click="handleRequestStart('database')"
              >
                <i class="i-ri-database-2-line" />
                {{ status === 'authenticated' ? '已登录，开始使用' : '登录后开始使用' }}
              </Button>
            </div>
          </div>
        </div>

        <!-- 二次确认：点两个"开始使用"的按钮都会先弹这里 -->
        <AlertDialog v-model:open="showConfirmDialog">
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                确认以{{ pendingIsLocal ? '本地存储' : '云端存储' }}开始？
              </AlertDialogTitle>
              <AlertDialogDescription as-child>
                <div class="text-sm space-y-3">
                  <div class="p-3 rounded-md bg-muted">
                    <p class="font-medium mb-1">
                      使用提示
                    </p>
                    <ul class="text-muted-foreground list-disc list-inside space-y-0.5">
                      <li>两种存储相互独立，<strong class="text-foreground">不会自动迁移</strong>已有数据</li>
                      <li>若之后切换到另一种模式，需要再次确认</li>
                      <li>随时可在首页右上角 ⚙️ 设置中切换存储模式</li>
                    </ul>
                  </div>
                  <div v-if="pendingIsLocal" class="p-3 border rounded-md bg-muted">
                    <p class="font-medium flex gap-1.5 items-center">
                      <i class="i-ri-information-line" />
                      本地存储说明
                    </p>
                    <p class="text-xs text-muted-foreground mt-1">
                      数据仅保存在当前浏览器 localStorage 中。清除浏览器数据、更换设备或隐私模式下都会无法访问。
                    </p>
                  </div>
                  <div v-if="pendingRequiresAuth" class="p-3 border rounded-md bg-muted">
                    <p class="font-medium flex gap-1.5 items-center">
                      <i class="i-ri-shield-check-line" />
                      云端存储需要登录
                    </p>
                    <p class="text-xs text-muted-foreground mt-1">
                      点击「确认并登录」后将弹出登录面板，<strong>登录成功后</strong>自动切换到云端存储并进入简历列表。
                    </p>
                  </div>
                  <p class="text-muted-foreground">
                    确认继续吗？
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel @click="cancelConfirm">
                取消
              </AlertDialogCancel>
              <!--
                不把 SigninModelItem 嵌到 AlertDialogAction 里。
                原因：AlertDialog 关闭时会连带卸载内部 DOM，导致 SigninModelItem DialogTrigger 来不及弹自己的面板。
                改为 confirmStart 先关 AlertDialog + QuickStart Dialog → nextTick → 打开下方独立 showSignInDialog。
              -->
              <AlertDialogAction
                class="text-white bg-black hover:bg-gray-800"
                @click="confirmStart"
              >
                <template v-if="pendingRequiresAuth">
                  <i class="i-ri-login-box-line" />
                  确认并登录
                </template>
                <template v-else>
                  确认开始
                </template>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>

    <!--
      独立的登录 Dialog（和 QuickStart Dialog / AlertDialog 都平级）
      内容直接嵌入 SigninSocialSignInButtons —— 与 /signin 页面、SigninModelItem 内部的完全一致
      在 confirmStart 中 nextTick 后打开，完全避免 AlertDialog 关闭时的 DOM 卸载冲突
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

    <template #fallback>
      <div
        class="text-lg text-white leading-[48px] font-semibold mx-auto mt-10 text-center rounded-4xl opacity-80 h-12 w-40 select-none shadow-md animate-pulse from-black to-gray-700 bg-linear-to-r"
      >
        &nbsp;
      </div>
    </template>
  </ClientOnly>
</template>
