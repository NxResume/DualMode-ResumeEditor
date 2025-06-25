// app/stores/resumeSettings.ts
import { isClient, useStorage } from '@vueuse/core'
import { defineStore, skipHydrate } from 'pinia'
import { computed } from 'vue'
import { fontList } from '~/constants'

export const useResumeSettingsStore = defineStore('resumeSettings', () => {
  // 所有简历的设置对象
  const allSettings = useStorage<Record<string, ResumeSettings>>(
    'nuxt-resume-editor-all-settings',
    {},
  )

  const route = useRoute() // 新增

  const reId = computed(() => {
    return (route.params as {
      id: string
    }).id as string
  })

  // 当前简历的设置
  const currentSettings = computed<ResumeSettings>({
    get: () => {
      if (!isClient)
        return getDefaultSettings()
      return allSettings.value[reId.value] ?? getDefaultSettings() as ResumeSettings
    },
    set: (val) => {
      allSettings.value[reId.value] = val
    },
  })

  // 获取当前字体对象
  const fontMap = computed(() => {
    return fontList?.find(font => font.value === currentSettings.value.fontname)
  })

  if (isClient) {
    useResumeStyleSync(currentSettings, fontMap)
  }

  // 更新当前简历的部分设置
  function updateCurrentSettings(partial: Partial<ResumeSettings>) {
    currentSettings.value = { ...currentSettings.value, ...partial }
  }

  // 单独更新图片位置
  function updateImagePosition(newPosition: Partial<ResumeSettings['imagePosition']>) {
    currentSettings.value.imagePosition = { ...currentSettings.value.imagePosition, ...newPosition }
  }

  // 重置当前简历设置为默认
  function resetCurrentSettings() {
    currentSettings.value = getDefaultSettings()
  }

  return {
    allSettings: skipHydrate(allSettings),
    currentSettings: skipHydrate(currentSettings),
    fontMap,
    updateCurrentSettings,
    updateImagePosition,
    resetCurrentSettings,
  }
})
