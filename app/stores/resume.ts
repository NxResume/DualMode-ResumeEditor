import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ResumeData {
  content: string
  theme: string
  plugins: string[]
}

export const useResumeStore = defineStore('resume', () => {
  // state
  const content = ref('')
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
    content,
    theme,
    plugins,
    // actions
    setContent,
    setTheme,
    addPlugin,
    removePlugin,
  }
})
