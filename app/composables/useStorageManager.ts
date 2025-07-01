import type { StorageMode } from '../../types/storage'
import { useStorage } from '@vueuse/core'
import { DatabaseStorageProvider } from './providers/databaseStorage'
import { LocalStorageProvider } from './providers/localStorage'

export function useStorageManager() {
  const currentMode = useStorage<StorageMode>('nuxt-resume-editor-storage-mode', 'database')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 存储提供者实例
  const localProvider = new LocalStorageProvider()
  const databaseProvider = new DatabaseStorageProvider()

  // 获取当前提供者
  const getCurrentProvider = () => {
    return currentMode.value === 'local' ? localProvider : databaseProvider
  }

  // 初始化存储模式
  const initializeMode = () => {
    if (import.meta.client) {
      currentMode.value = localProvider.getCurrentMode()
    }
  }

  const switchMode = async (mode: StorageMode) => {
    currentMode.value = mode
  }

  // 检查数据库连接
  const checkDatabaseConnection = async (): Promise<boolean> => {
    try {
      await $fetch('/api/health')
      return true
    }
    catch {
      return false
    }
  }

  return {
    currentMode: readonly(currentMode),
    isLoading: readonly(isLoading),
    error: readonly(error),
    switchMode,
    initializeMode,
    getCurrentProvider,
    checkDatabaseConnection,
  }
}
