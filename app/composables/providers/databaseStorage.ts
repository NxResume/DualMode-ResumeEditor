import type { ResumeData, ResumeSettings } from '~~/types/resume'
import type { IStorageProvider, StorageMode } from '~~/types/storage'
import { getDefaultSettings } from '~/utils'

// 定义API响应的类型
interface ApiResponse<T> {
  data: T
}

interface ResumeApiData {
  id: string
  name: string
  content: string
  theme: string
  plugins: string
  createdAt: string
  updatedAt: string
  isDefault?: boolean
  settings?: ResumeSettings
}

interface SettingsApiData {
  fontname: string
  pagePadding: number
  pageLineHeight: number
  pageBackground: string
  pageThemeColor: string
  imagePosition: string
  isScrollable: boolean
  editorMode: 'source' | 'wysiwyg'
}

export class DatabaseStorageProvider implements IStorageProvider {
  getCurrentMode(): StorageMode {
    return 'database'
  }

  async getResumes(): Promise<ResumeData[]> {
    try {
      const response = await $fetch<ApiResponse<ResumeApiData[]>>('/api/resumes')
      if (!response.data) {
        return []
      }

      return response.data.map(resume => ({
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
      const response = await $fetch<ApiResponse<ResumeApiData>>(`/api/resumes/${id}`)
      if (!response.data) {
        return undefined
      }

      if (response.data.settings)
        response.data.settings.imagePosition = JSON.parse(response.data.settings?.imagePosition as unknown as string)

      return {
        ...response.data,
        plugins: JSON.parse(response.data.plugins || '[]'),
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt),
      }
    }
    catch (error) {
      console.error('获取简历失败:', error)
      return undefined
    }
  }

  async createResume(resumeData: Omit<ResumeData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResumeData> {
    try {
      const response = await $fetch<ApiResponse<ResumeApiData>>('/api/resumes', {
        method: 'POST',
        body: {
          ...resumeData,
        },
      })

      if (!response.data) {
        throw new Error('创建简历失败: 服务器返回空数据')
      }

      return {
        ...response.data,
        plugins: JSON.parse(response.data.plugins || '[]'),
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt),
      }
    }
    catch (error) {
      console.error('创建简历失败:', error)
      throw error
    }
  }

  async updateResume(id: string, updates: Partial<ResumeData>): Promise<ResumeData> {
    try {
      const response = await $fetch<ApiResponse<ResumeApiData>>(`/api/resumes/${id}`, {
        method: 'PUT',
        body: {
          ...updates,
        },
      })

      if (!response.data) {
        throw new Error('更新简历失败: 服务器返回空数据')
      }

      return {
        ...response.data,
        plugins: JSON.parse(response.data.plugins || '[]'),
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt),
      }
    }
    catch (error) {
      console.error('更新简历失败:', error)
      throw error
    }
  }

  async deleteResume(id: string): Promise<{
    success: boolean
    message: string
  }> {
    try {
      const data = await $fetch(`/api/resumes/${id}`, {
        method: 'DELETE',
      })
      return data
    }
    catch (error) {
      console.error('删除简历失败:', error)
      throw error
    }
  }

  async getSettings(resumeId: string): Promise<ResumeSettings> {
    try {
      const response = await $fetch<ApiResponse<SettingsApiData>>(`/api/resumes/${resumeId}/settings`)
      if (!response.data) {
        return getDefaultSettings()
      }

      return {
        ...response.data,
        imagePosition: JSON.parse(response.data.imagePosition || '{}'),
      } as ResumeSettings
    }
    catch (error) {
      console.error('获取设置失败:', error)
      return getDefaultSettings()
    }
  }

  async updateSettings(resumeId: string, settings: Partial<ResumeSettings>): Promise<ResumeSettings> {
    try {
      const response = await $fetch<ApiResponse<SettingsApiData>>(`/api/resumes/${resumeId}/settings`, {
        method: 'PUT',
        body: {
          ...settings,
        },
      })

      if (!response.data) {
        throw new Error('更新设置失败: 服务器返回空数据')
      }

      return {
        ...response.data,
        imagePosition: JSON.parse(response.data.imagePosition || '{}'),
      } as ResumeSettings
    }
    catch (error) {
      console.error('更新设置失败:', error)
      throw error
    }
  }

  async copySettings(originId: string, resumeId: string): Promise<ResumeSettings> {
    const originSettings = await this.getSettings(originId)
    return await this.updateSettings(resumeId, originSettings)
  }
}
