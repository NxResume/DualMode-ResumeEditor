<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const storageManager = useStorageManager()
const selectedMode = ref<'local' | 'database'>('local')
const isDatabaseConnected = ref(false)

const { currentMode, isLoading, error } = storageManager

function handleModeChange(newMode: 'local' | 'database' | null) {
  if (newMode) {
    storageManager.switchMode(newMode)
  }
}

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
  </div>
</template>
