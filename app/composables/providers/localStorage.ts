import type { ResumeData, ResumeSettings } from '~~/types/resume'
import type { IStorageProvider, StorageMode } from '~~/types/storage'
import { nanoid } from 'nanoid'
import { getDefaultSettings } from '~/utils'

export class LocalStorageProvider implements IStorageProvider {
  private readonly RESUMES_KEY = 'nuxt-resume-editor-resumes'
  private readonly SETTINGS_KEY = 'nuxt-resume-editor-all-settings'
  private readonly MODE_KEY = 'nuxt-resume-editor-storage-mode'

  getCurrentMode(): StorageMode {
    if (import.meta.client) {
      return localStorage.getItem(this.MODE_KEY) as StorageMode || 'database'
    }
    return 'database'
  }

  async getResumes(): Promise<ResumeData[]> {
    if (!import.meta.client)
      return []

    const stored = localStorage.getItem(this.RESUMES_KEY)
    if (!stored)
      return []

    const resumes = JSON.parse(stored)
    return resumes.map((resume: any) => ({
      ...resume,
      createdAt: new Date(resume.createdAt),
      updatedAt: new Date(resume.updatedAt),
    }))
  }

  async createResume(resumeData: Omit<ResumeData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResumeData> {
    if (!import.meta.client)
      throw new Error('Local storage only available on client')

    const resumes = await this.getResumes()
    const newResume: ResumeData = {
      ...resumeData,
      id: nanoid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    resumes.push(newResume)
    localStorage.setItem(this.RESUMES_KEY, JSON.stringify(resumes))

    // 设置默认设置
    const allSettings = this.getAllSettings()
    allSettings[newResume.id] = getDefaultSettings()
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(allSettings))

    return newResume
  }

  async updateResume(id: string, updates: Partial<ResumeData>): Promise<ResumeData> {
    if (!import.meta.client)
      throw new Error('Local storage only available on client')

    const resumes = await this.getResumes()
    const index = resumes.findIndex(r => r.id === id)
    if (index === -1)
      throw new Error('Resume not found')

    const updatedResume = {
      ...resumes[index],
      ...updates,
      updatedAt: new Date(),
    } as ResumeData

    resumes[index] = updatedResume
    localStorage.setItem(this.RESUMES_KEY, JSON.stringify(resumes))
    return updatedResume
  }

  async deleteResume(id: string): Promise<{
    success: boolean
    message: string
  }> {
    if (!import.meta.client)
      throw new Error('Local storage only available on client')

    const resumes = await this.getResumes()
    const filtered = resumes.filter(r => r.id !== id)
    localStorage.setItem(this.RESUMES_KEY, JSON.stringify(filtered))

    // 删除相关设置
    const allSettings = this.getAllSettings()
    delete allSettings[id]
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(allSettings))
    return {
      success: true,
      message: '删除成功',
    }
  }

  async getSettings(resumeId: string): Promise<ResumeSettings> {
    if (!import.meta.client)
      return getDefaultSettings()

    const allSettings = this.getAllSettings()
    return allSettings[resumeId] || getDefaultSettings()
  }

  async updateSettings(resumeId: string, settings: Partial<ResumeSettings>): Promise<ResumeSettings> {
    if (!import.meta.client)
      throw new Error('Local storage only available on client')

    const allSettings = this.getAllSettings()
    const currentSettings = allSettings[resumeId] || getDefaultSettings()
    const updatedSettings: ResumeSettings = { ...currentSettings, ...settings }

    allSettings[resumeId] = updatedSettings
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(allSettings))

    return updatedSettings
  }

  private getAllSettings(): Record<string, ResumeSettings> {
    if (!import.meta.client)
      return {}

    const stored = localStorage.getItem(this.SETTINGS_KEY)
    return stored ? JSON.parse(stored) : {}
  }

  async getResumeById(id: string): Promise<ResumeData | undefined> {
    if (!import.meta.client)
      return undefined
    const resumes = await this.getResumes()
    return resumes.find(r => r.id === id)
  }

  async copySettings(originId: string, resumeId: string): Promise<ResumeSettings> {
    const originSettings = await this.getSettings(originId)
    return await this.updateSettings(resumeId, originSettings)
  }
}
