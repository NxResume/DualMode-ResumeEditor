import type { ResumeData } from '~~/types/resume'
import tm1 from '~/constants/templates/tm1.md?raw'

const storageManager = useStorageManager()

// actions
async function fetchResumes() {
  const provider = storageManager.getCurrentProvider()
  const data = await provider.getResumes()
  return data
}

async function duplicateResume(id: string, resumes: ResumeData[]) {
  const original = resumes.find(r => r.id === id)
  if (original) {
    const provider = storageManager.getCurrentProvider()
    const duplicated = await provider.createResume({
      name: `${original.name} (副本)`,
      content: original.content,
      theme: original.theme,
      plugins: original.plugins,
      isDefault: false,
    })

    await provider.copySettings(id, duplicated.id)
    return duplicated
  }
}

async function updateResume(id: string, updates: Partial<ResumeData>) {
  const provider = storageManager.getCurrentProvider()
  const updated = await provider.updateResume(id, updates)
  return updated
}

async function renameResume(id: string, name: string) {
  return await updateResume(id, { name })
}

async function deleteResume(id: string) {
  const provider = storageManager.getCurrentProvider()
  return await provider.deleteResume(id)
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
  return newResume
}

async function saveCurrentResume(currentResume: ResumeData) {
  if (currentResume) {
    await updateResume(currentResume.id, {
      name: currentResume.name,
      content: currentResume.content,
      theme: currentResume.theme,
      plugins: currentResume.plugins,
      isDefault: currentResume.isDefault,
    })
  }
}

async function fetchResumeById(id: string) {
  const provider = storageManager.getCurrentProvider()
  const result = await provider.getResumeById(id)
  if (result?.theme)
    reTheme.setTheme(result.theme as any)

  return result
}

async function updateCurrentSettings(resumeId: string, partial: Partial<ResumeSettings>) {
  const provider = storageManager.getCurrentProvider()
  const updated = await provider.updateSettings(resumeId, partial)
  return updated
}

export default {
  fetchResumes,
  duplicateResume,
  updateResume,
  renameResume,
  deleteResume,
  createResume,
  saveCurrentResume,
  fetchResumeById,
  updateCurrentSettings,
}
