import type { ResumeData, ResumeSettings } from '../../../types/resume'
import type { IStorageProvider, StorageMode } from '../../../types/storage'
import { getDefaultSettings } from '../../utils'

export class DatabaseStorageProvider implements IStorageProvider {
  getCurrentMode(): StorageMode {
    return 'database'
  }

  async getResumes(): Promise<ResumeData[]> {
    try {
      const { data } = await $fetch('/api/resumes')
      return data.map((resume: any) => ({
        ...resume,
        plugins: JSON.parse(resume.plugins || '[]'),
        createdAt: new Date(resume.createdAt),
        updatedAt: new Date(resume.updatedAt),
      }))
    }
    catch (error) {
      console.error('获取简历列表失败:', error)
      return []
    }
  }

  async getResumeById(id: string): Promise<ResumeData | undefined> {
    try {
      const { data } = await $fetch(`/api/resumes/${id}`)
      if (!data)
        return undefined
      return {
        ...data,
        plugins: JSON.parse(data.plugins || '[]'),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      }
    }
    catch (error) {
      console.error('获取简历失败:', error)
      return undefined
    }
  }

  async createResume(resumeData: Omit<ResumeData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResumeData> {
    try {
      const { data } = await $fetch('/api/resumes', {
        method: 'POST',
        body: {
          ...resumeData,
          plugins: JSON.stringify(resumeData.plugins || []),
        },
      })

      return {
        ...data,
        plugins: JSON.parse(data.plugins || '[]'),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      }
    }
    catch (error) {
      console.error('创建简历失败:', error)
      throw error
    }
  }

  async updateResume(id: string, updates: Partial<ResumeData>): Promise<ResumeData> {
    try {
      const { data } = await $fetch(`/api/resumes/${id}`, {
        method: 'PUT',
        body: {
          ...updates,
          plugins: JSON.stringify(updates.plugins || []),
        },
      })

      return {
        ...data,
        plugins: JSON.parse(data.plugins || '[]'),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      }
    }
    catch (error) {
      console.error('更新简历失败:', error)
      throw error
    }
  }

  async deleteResume(id: string): Promise<void> {
    try {
      await $fetch(`/api/resumes/${id}`, {
        method: 'DELETE',
      })
    }
    catch (error) {
      console.error('删除简历失败:', error)
      throw error
    }
  }

  async getSettings(resumeId: string): Promise<ResumeSettings> {
    try {
      const { data } = await $fetch(`/api/resumes/${resumeId}/settings`)
      return {
        ...data,
        imagePosition: JSON.parse(data.imagePosition || '{}'),
      } as ResumeSettings
    }
    catch (error) {
      console.error('获取设置失败:', error)
      return getDefaultSettings()
    }
  }

  async updateSettings(resumeId: string, settings: Partial<ResumeSettings>): Promise<ResumeSettings> {
    try {
      const { data } = await $fetch(`/api/resumes/${resumeId}/settings`, {
        method: 'PUT',
        body: {
          ...settings,
        },
      })

      return {
        ...data,
        imagePosition: JSON.parse(data.imagePosition || '{}'),
      } as ResumeSettings
    }
    catch (error) {
      console.error('更新设置失败:', error)
      throw error
    }
  }
}
