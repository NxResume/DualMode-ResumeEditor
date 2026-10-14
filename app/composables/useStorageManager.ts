import type { StorageMode } from '../../types/storage'
import { useStorage } from '@vueuse/core'
import { DatabaseStorageProvider } from './providers/databaseStorage'
import { LocalStorageProvider } from './providers/localStorage'

const STORAGE_MODE_KEY = 'nuxt-resume-editor-storage-mode'

export function useStorageManager() {
  // 默认值改为 local，优先保证匿名用户可用
  const currentMode = useStorage<StorageMode>(STORAGE_MODE_KEY, 'local')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 存储提供者实例
  const localProvider = new LocalStorageProvider()
  const databaseProvider = new DatabaseStorageProvider()

  // 获取当前提供者
  const getCurrentProvider = () => {
    return currentMode.value === 'local' ? localProvider : databaseProvider
  }

  // 判断用户是否已经手动选择过模式（localStorage 中有原始值即算选过）
  const hasUserExplicitChoice = (): boolean => {
    if (!import.meta.client)
      return false
    return localStorage.getItem(STORAGE_MODE_KEY) !== null
  }

  // 初始化存储模式：
  // 1. 若用户之前手动选过 → 保持用户选择
  // 2. 从未选过 → 默认 local（不再按登录状态推断，云端需用户主动开开关）
  const initializeMode = () => {
    if (!import.meta.client)
      return

    if (hasUserExplicitChoice()) {
      // 用户有明确选择，直接沿用（localProvider.getCurrentMode 会读原始 localStorage 值）
      currentMode.value = localProvider.getCurrentMode()
      return
    }

    // 首次访问：默认本地存储
    currentMode.value = 'local'
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
