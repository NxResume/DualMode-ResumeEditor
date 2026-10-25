export interface ResumeData {
  id: string
  name: string
  content: string
  theme: ThemeName
  plugins: string[]
  createdAt: Date
  updatedAt: Date
  isDefault?: boolean
  settings?: ResumeSettings
}

export interface ResumeSettings {
  fontname: string
  pagePadding: number
  pageLineHeight: number
  pageBackground: string
  pageThemeColor: string
  imagePosition: { top: number, left: number, scale: number | string }
  isScrollable: boolean
  /** 智能一页：开启后自动收紧行高、等比缩字号，把简历压进一页 A4 */
  fitOnePage: boolean
  editorMode: 'source' | 'wysiwyg'
}

export interface ResumeList {
  resumes: ResumeData[]
  currentResumeId: string | null
}
