import type { ResumeData } from '../../types/resume'
import { defineStore, skipHydrate } from 'pinia'
import { ref } from 'vue'
import tm1 from '~/templates/tm1.md?raw'
import { reTheme, ThemeName } from '~/utils'
import { useStorageManager } from '../composables/useStorageManager'

export const useResumeStore = defineStore('resume', () => {
  // state
  const resumes = ref<ResumeData[]>([])
  const currentResumeId = ref<string | null>(null)
  const loading = ref(false)
  const storageManager = useStorageManager()
  const currentResume = ref<ResumeData>()
  const resumeContent = ref<string>('')

  // actions
  async function fetchResumes() {
    loading.value = true
    try {
      const provider = storageManager.getCurrentProvider()
      const data = await provider.getResumes()
      resumes.value = data
    }
    finally {
      loading.value = false
    }
  }

  // 主题相关
  const applyTheme = () => {
    if (currentResume.value?.theme) {
      reTheme.setTheme(currentResume.value?.theme as ThemeName)
    }
  }

  async function fetchResumesById(id: string) {
    const provider = storageManager.getCurrentProvider()
    const result = await provider.getResumeById(id)
    currentResume.value = result
    resumeContent.value = result?.content || ''
    if (result?.theme)
      reTheme.setTheme(result.theme as ThemeName)

    return result
  }

  async function createResume(name: string = '新简历') {
    const provider = storageManager.getCurrentProvider()
    const newResume = await provider.createResume({
      name,
      content: tm1,
      theme: ThemeName.Default,
      plugins: [],
      isDefault: false,
    })
    resumes.value.push(newResume)
    currentResumeId.value = newResume.id
    return newResume
  }

  async function deleteResume(id: string) {
    const provider = storageManager.getCurrentProvider()
    await provider.deleteResume(id)
    const index = resumes.value.findIndex(r => r.id === id)
    if (index > -1) {
      resumes.value.splice(index, 1)
      if (currentResumeId.value === id) {
        currentResumeId.value = resumes.value[0]?.id || null
      }
    }
  }

  async function updateResume(id: string, updates: Partial<ResumeData>) {
    const provider = storageManager.getCurrentProvider()
    const updated = await provider.updateResume(id, updates)
    const index = resumes.value.findIndex(r => r.id === id)
    if (index > -1) {
      resumes.value[index] = updated
    }
  }

  function renameResume(id: string, name: string) {
    updateResume(id, { name })
  }

  async function duplicateResume(id: string) {
    const original = resumes.value.find(r => r.id === id)
    if (original) {
      const provider = storageManager.getCurrentProvider()
      const duplicated = await provider.createResume({
        name: `${original.name} (副本)`,
        content: original.content,
        theme: original.theme,
        plugins: original.plugins,
        isDefault: false,
      })
      resumes.value.push(duplicated)
      currentResumeId.value = duplicated.id
      return duplicated
    }
  }

  async function saveCurrentResume() {
    if (currentResume.value) {
      await updateResume(currentResume.value.id, {
        name: currentResume.value.name,
        content: resumeContent.value,
        theme: currentResume.value.theme,
        plugins: currentResume.value.plugins,
        isDefault: currentResume.value.isDefault,
      })
    }
  }

  return {
    resumes: skipHydrate(resumes),
    currentResumeId: skipHydrate(currentResumeId),
    loading,
    currentResume: skipHydrate(currentResume),
    resumeContent,
    saveCurrentResume,
    fetchResumesById,
    fetchResumes,
    createResume,
    deleteResume,
    updateResume,
    renameResume,
    duplicateResume,
    applyTheme,
  }
})
