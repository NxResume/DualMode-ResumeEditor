import reTheme, { ThemeName } from 'resume-theme'
import 'resume-theme/themes'

// 测试使用 本地主题
// import reTheme, { ThemeName } from '../../../resume-theme/src'
// import '../../../resume-theme/dist/themes/index.css'

export { reTheme, ThemeName }

/**
 * A4 纸张像素尺寸（96dpi）。
 *
 * 页面几何必须是 A4 比例：导出 PDF 时页面图按 A4 宽度缩放，
 * 高度比例如有偏差，多出来的部分就会变成每页底部的空白
 * （794×1070 比例 1.3476 → 底部空 14mm；794×1123 比例 1.4141 ≈ A4 的 1.4143 → 基本为零）。
 */
export const A4_WIDTH_PX = 794
export const A4_HEIGHT_PX = 1123

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
