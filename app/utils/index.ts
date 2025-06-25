import reTheme, { ThemeName } from 'resume-theme'
import 'resume-theme/themes'

// 测试使用 本地主题
// import reTheme, { ThemeName } from '../../../resume-theme/src'
// import '../../../resume-theme/dist/themes/index.css'

export { reTheme, ThemeName }

interface ResumeSettings {
  fontname: string
  pagePadding: number
  pageLineHeight: number
  pageBackground: string
  pageThemeColor: string
  imagePosition: { top: number, left: number, scale: number | string }
  isScrollable: boolean
  editorMode: 'source' | 'wysiwyg'
  // 可扩展其它字段
}

function getDefaultSettings(): ResumeSettings {
  return {
    fontname: 'default',
    pagePadding: 36,
    pageLineHeight: 1.9,
    pageBackground: 'default',
    pageThemeColor: '0,0,0',
    imagePosition: { top: 66, left: 391, scale: '0.8 0.8' },
    isScrollable: false,
    editorMode: 'source',
  }
}

export type { ResumeSettings }
export { getDefaultSettings }
