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

export interface ResumeList {
  resumes: ResumeData[]
  currentResumeId: string | null
}
