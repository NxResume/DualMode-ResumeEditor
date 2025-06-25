import { isClient, useStorage } from '@vueuse/core'
import { nanoid } from 'nanoid'
import { defineStore, skipHydrate } from 'pinia'

import tm1 from '~/templates/tm1.md?raw'
import { reTheme, ThemeName } from '~/utils'

export interface ResumeData {
  id: string
  name: string
  content: string
  theme: string
  plugins: string[]
  createdAt: Date
  updatedAt: Date
  isDefault?: boolean
}

export const useResumeStore = defineStore('resume', () => {
  // state
  const resumes = useStorage<ResumeData[]>('nuxt-resume-editor-resumes', [])
  const currentResumeId = useStorage<string | null>('nuxt-resume-editor-current', null)
  const allSettings = useStorage<Record<string, ResumeSettings>>(
    'nuxt-resume-editor-all-settings',
    {},
  )

  // 初始化默认简历
  const initializeDefaultResume = () => {
    if (resumes.value.length === 0) {
      const defaultResume: ResumeData = {
        id: nanoid(),
        name: '我的简历',
        content: tm1,
        theme: ThemeName.Default,
        plugins: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDefault: true,
      }
      resumes.value.push(defaultResume)
      currentResumeId.value = defaultResume.id
      allSettings.value[defaultResume.id] = getDefaultSettings()
    }
  }

  // 计算属性
  const currentResume = computed(() => {
    return resumes.value.find(r => r.id === currentResumeId.value) || resumes.value[0]
  })

  const content = computed({
    get: () => currentResume.value?.content || tm1,
    set: (value: string) => {
      if (currentResume.value) {
        currentResume.value.content = value
        currentResume.value.updatedAt = new Date()
      }
    },
  })

  const theme = computed({
    get: () => currentResume.value?.theme || ThemeName.Default,
    set: (value: ThemeName) => {
      if (currentResume.value) {
        currentResume.value.theme = value
        currentResume.value.updatedAt = new Date()
      }
    },
  })

  const plugins = computed({
    get: () => currentResume.value?.plugins || [],
    set: (value: string[]) => {
      if (currentResume.value) {
        currentResume.value.plugins = value
        currentResume.value.updatedAt = new Date()
      }
    },
  })

  // actions
  function createResume(name: string = '新简历') {
    const newResume: ResumeData = {
      id: nanoid(),
      name,
      content: tm1,
      theme: ThemeName.Default,
      plugins: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    resumes.value.push(newResume)
    currentResumeId.value = newResume.id
    allSettings.value[newResume.id] = getDefaultSettings()
    return newResume
  }

  function deleteResume(id: string) {
    const index = resumes.value.findIndex(r => r.id === id)
    if (index > -1) {
      resumes.value.splice(index, 1)
      // 如果删除的是当前简历，切换到第一个简历
      if (currentResumeId.value === id) {
        currentResumeId.value = resumes.value[0]?.id || null
      }
    }
  }

  function switchResume(id: string) {
    if (resumes.value.find(r => r.id === id)) {
      currentResumeId.value = id
    }
  }

  function renameResume(id: string, name: string) {
    const resume = resumes.value.find(r => r.id === id)
    if (resume) {
      resume.name = name
      resume.updatedAt = new Date()
    }
  }

  function duplicateResume(id: string) {
    const original = resumes.value.find(r => r.id === id)
    if (original) {
      const duplicated: ResumeData = {
        ...original,
        id: nanoid(),
        name: `${original.name} (副本)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDefault: false,
      }
      resumes.value.push(duplicated)
      currentResumeId.value = duplicated.id
      allSettings.value[duplicated.id] = allSettings.value[id] as any
      return duplicated
    }
  }

  // 原有的方法保持不变，但内部逻辑需要适配
  function setContent(newContent: string) {
    content.value = newContent
  }

  function resetContent() {
    content.value = tm1
  }

  function setTheme(newTheme: ThemeName) {
    theme.value = newTheme
  }

  function addPlugin(plugin: string) {
    if (!plugins.value.includes(plugin)) {
      plugins.value = [...plugins.value, plugin]
    }
  }

  function removePlugin(plugin: string) {
    plugins.value = plugins.value.filter(p => p !== plugin)
  }

  const applyTheme = () => {
    nextTick(() => {
      reTheme.setTheme(theme.value as ThemeName)
    })
  }

  onMounted(() => {
    if (isClient) {
      initializeDefaultResume()
      applyTheme()
    }
  })

  if (isClient) {
    watch(theme, () => {
      applyTheme()
    }, {
      immediate: true,
    })
  }

  return {
    // state
    resumes: skipHydrate(resumes),
    currentResumeId: skipHydrate(currentResumeId),
    currentResume,
    content: skipHydrate(content),
    theme: skipHydrate(theme),
    plugins,
    // actions
    createResume,
    deleteResume,
    switchResume,
    renameResume,
    duplicateResume,
    setContent,
    setTheme,
    addPlugin,
    removePlugin,
    applyTheme,
    resetContent,
  }
})
