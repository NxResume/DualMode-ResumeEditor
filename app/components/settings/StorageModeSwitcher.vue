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

const storageManager = useStorageManager()
const selectedMode = ref<'local' | 'database'>('database')
const isDatabaseConnected = ref(false)
const pendingMode = ref<'local' | 'database' | null>(null)
const showConfirmDialog = ref(false)

const { currentMode, isLoading, error } = storageManager

function handleModeChange(value: any) {
  // 与当前模式相同，不处理
  if (value === currentMode.value) {
    selectedMode.value = value
    return
  }
  // 先回滚选中值，等用户确认后再真正切换
  selectedMode.value = currentMode.value
  pendingMode.value = value
  showConfirmDialog.value = true
}

function confirmSwitch() {
  if (pendingMode.value) {
    storageManager.switchMode(pendingMode.value)
    selectedMode.value = pendingMode.value
  }
  showConfirmDialog.value = false
  pendingMode.value = null
}

function cancelSwitch() {
  showConfirmDialog.value = false
  pendingMode.value = null
}

const isSwitchingToLocal = computed(() => pendingMode.value === 'local')

async function checkDatabaseConnection() {
  if (currentMode.value === 'database') {
    isDatabaseConnected.value = await storageManager.checkDatabaseConnection()
  }
}

onMounted(() => {
  selectedMode.value = currentMode.value
  checkDatabaseConnection()
})

watch(currentMode, (newMode) => {
  selectedMode.value = newMode
  if (newMode === 'database') {
    checkDatabaseConnection()
  }
})
</script>

<template>
  <div class="storage-mode-switcher">
    <div class="flex gap-2 items-center">
      <Label>存储模式</Label>
      <Select v-model="selectedMode" @update:model-value="handleModeChange">
        <SelectTrigger class="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="local">
            <div class="flex gap-2 items-center">
              <Icon name="lucide:hard-drive" />
              本地存储
            </div>
          </SelectItem>
          <SelectItem value="database">
            <div class="flex gap-2 items-center">
              <Icon name="lucide:database" />
              数据库存储
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- 状态指示器 -->
    <div class="text-sm text-muted-foreground mt-2">
      <div v-if="isLoading" class="flex gap-1 items-center">
        <Icon name="lucide:loader-2" class="animate-spin" />
        正在切换存储模式...
      </div>
      <div v-else-if="error" class="text-destructive">
        {{ error }}
      </div>
      <div v-else class="flex gap-1 items-center">
        <Icon :name="currentMode === 'local' ? 'lucide:hard-drive' : 'lucide:database'" />
        当前使用{{ currentMode === 'local' ? '本地存储' : '数据库存储' }}
      </div>
    </div>

    <!-- 数据库连接状态 -->
    <div v-if="currentMode === 'database'" class="mt-2">
      <div class="text-sm flex gap-1 items-center">
        <Icon
          :name="isDatabaseConnected ? 'lucide:check-circle' : 'lucide:x-circle'"
          :class="isDatabaseConnected ? 'text-green-500' : 'text-red-500'"
        />
        {{ isDatabaseConnected ? '数据库连接正常' : '数据库连接失败' }}
      </div>
    </div>

    <!-- 本地存储说明 -->
    <div v-if="currentMode === 'local'" class="mt-3 p-3 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
      <div class="text-sm flex gap-2 items-start">
        <Icon name="lucide:info" class="mt-0.5 text-amber-600 dark:text-amber-400 flex-none" />
        <div class="text-amber-800 dark:text-amber-200 space-y-1">
          <p class="font-medium">本地存储模式</p>
          <ul class="list-disc list-inside text-xs space-y-0.5 text-amber-700 dark:text-amber-300">
            <li>数据仅保存在当前浏览器的 localStorage 中</li>
            <li>清除浏览器数据或更换设备会导致数据丢失</li>
            <li>不需要登录即可使用，适合本地快速编辑</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 切换确认弹窗 -->
    <AlertDialog v-model:open="showConfirmDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认切换存储模式？</AlertDialogTitle>
          <AlertDialogDescription as-child>
            <div class="space-y-3 text-sm">
              <div v-if="isSwitchingToLocal">
                即将切换到：<span class="font-semibold">本地存储</span>
              </div>
              <div v-else>
                即将切换到：<span class="font-semibold">数据库存储</span>
              </div>
              <div class="p-3 rounded-md bg-muted">
                <p class="font-medium mb-1">⚠️ 重要提示</p>
                <ul class="list-disc list-inside space-y-0.5 text-muted-foreground">
                  <li>两种存储相互独立，切换后<strong class="text-foreground">不会自动迁移</strong>现有简历数据</li>
                  <li>切换后简历列表会显示为目标存储中的内容</li>
                  <li>原模式下的数据仍然保留，切回原模式即可再次查看</li>
                </ul>
              </div>
              <p class="text-muted-foreground">确认要继续切换吗？</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="cancelSwitch">
            取消
          </AlertDialogCancel>
          <AlertDialogAction class="bg-black hover:bg-gray-800 text-white" @click="confirmSwitch">
            确认切换
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
