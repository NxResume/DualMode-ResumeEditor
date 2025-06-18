import { isClient, useStorage } from '@vueuse/core'
import { defineStore, skipHydrate } from 'pinia'
import { ref } from 'vue'

import tm1 from '~/templates/tm1.md?raw'
import { reTheme, ThemeName } from '~/utils'

export interface ResumeData {
  content: string
  theme: string
  plugins: string[]
}

export const useResumeStore = defineStore('resume', () => {
  // state
  const content = useStorage('nuxt-resume-editor-resume', tm1)
  const theme = useStorage<ThemeName>('nuxt-resume-editor-theme', ThemeName.Default)
  const plugins = ref<string[]>([])

  // actions
  function setContent(newContent: string) {
    content.value = newContent
  }

  function setTheme(newTheme: ThemeName) {
    theme.value = newTheme
  }

  function addPlugin(plugin: string) {
    if (!plugins.value.includes(plugin)) {
      plugins.value.push(plugin)
    }
  }

  function removePlugin(plugin: string) {
    plugins.value = plugins.value.filter(p => p !== plugin)
  }

  const applyTheme = () => {
    nextTick(() => {
      reTheme.setTheme(theme.value)
    })
  }

  onMounted(() => {
    if (isClient) {
      // 确保先应用当前主题
      applyTheme()

      watch(theme, () => {
        applyTheme()
      }, {
        immediate: true,
      })
    }
  })

  return {
    // state
    content: skipHydrate(content),
    theme: skipHydrate(theme),
    plugins,
    // actions
    setContent,
    setTheme,
    addPlugin,
    removePlugin,
    applyTheme,
  }
})
