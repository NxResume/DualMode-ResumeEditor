import { useLocalStorage } from '@vueuse/core'
import { defineStore, skipHydrate } from 'pinia'
import { ref } from 'vue'
import tm1 from '~/templates/tm1.md?raw'

export interface ResumeData {
  content: string
  theme: string
  plugins: string[]
}

export const useResumeStore = defineStore('resume', () => {
  // state
  const content = useLocalStorage('nuxt-resume-editor-resume', tm1)
  const theme = ref('default')
  const plugins = ref<string[]>([])

  // actions
  function setContent(newContent: string) {
    content.value = newContent
  }

  function setTheme(newTheme: string) {
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

  return {
    // state
    content: skipHydrate(content),
    theme,
    plugins,
    // actions
    setContent,
    setTheme,
    addPlugin,
    removePlugin,
  }
})
