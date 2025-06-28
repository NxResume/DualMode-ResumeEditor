export type StorageMode = 'local' | 'database'

export interface StorageConfig {
  mode: StorageMode
  databaseUrl?: string
}

export interface IStorageProvider {
  // 简历相关
  getResumes: () => Promise<ResumeData[]>
  getResumeById: (id: string) => Promise<ResumeData | undefined>
  createResume: (resume: Omit<ResumeData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ResumeData>
  updateResume: (id: string, updates: Partial<ResumeData>) => Promise<ResumeData>
  deleteResume: (id: string) => Promise<void>

  // 设置相关
  getSettings: (resumeId: string) => Promise<ResumeSettings>
  updateSettings: (resumeId: string, settings: Partial<ResumeSettings>) => Promise<ResumeSettings>

  // 模式相关
  getCurrentMode: () => StorageMode
}
