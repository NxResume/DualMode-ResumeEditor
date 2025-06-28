import type { ResumeSettings } from '../../types/resume'
import { isClient } from '@vueuse/core'
// app/stores/resumeSettings.ts
import { defineStore, skipHydrate } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStorageManager } from '../composables/useStorageManager'
import { getDefaultSettings } from '../utils'

export const useResumeSettingsStore = defineStore('resumeSettings', () => {
  const storageManager = useStorageManager()
  const route = useRoute()
  const reId = computed(() => (route.params as { id: string }).id as string)

  // 当前简历的设置
  const currentSettings = ref<ResumeSettings>(getDefaultSettings())
  const loading = ref(false)

  if (isClient) {
    useResumeStyleSync(currentSettings)
  }

  // 加载当前简历设置
  async function fetchCurrentSettings() {
    loading.value = true
    try {
      if (!reId.value)
        return

      const provider = storageManager.getCurrentProvider()
      const settings = await provider.getSettings(reId.value)
      currentSettings.value = settings
    }
    catch {
      currentSettings.value = getDefaultSettings()
    }
    finally {
      loading.value = false
    }
  }

  // 更新当前简历的部分设置
  async function updateCurrentSettings(partial: Partial<ResumeSettings>) {
    const provider = storageManager.getCurrentProvider()
    const updated = await provider.updateSettings(reId.value, partial)
    currentSettings.value = updated
  }

  // 单独更新图片位置
  async function updateImagePosition(newPosition: Partial<ResumeSettings['imagePosition']>) {
    await updateCurrentSettings({ imagePosition: { ...currentSettings.value.imagePosition, ...newPosition } })
  }

  // 重置当前简历设置为默认
  async function resetCurrentSettings() {
    await updateCurrentSettings(getDefaultSettings())
  }

  async function saveCurrentSettings() {
    await updateCurrentSettings(currentSettings.value)
  }

  // 监听路由变化或存储模式变化时自动加载
  watch([reId, () => storageManager.currentMode.value], fetchCurrentSettings, { immediate: true })

  return {
    currentSettings: skipHydrate(currentSettings),
    loading,
    saveCurrentSettings,
    fetchCurrentSettings,
    updateCurrentSettings,
    updateImagePosition,
    resetCurrentSettings,
  }
})
