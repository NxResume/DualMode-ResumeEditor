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

/**
 * 判断主题色是否「跟随主题」。
 *
 * 主题包（resume-theme）里每套主题都有自己的签名色：
 * `--resume-page-theme: var(--resume-theme-color, 142, 36, 42)` —— 用户色从继承下来的
 * `--resume-theme-color` 取，没设过就回退到主题签名色。
 * 所以「没选过色」必须表达成「不写变量」，而不是写一个具体颜色，否则永远盖掉主题签名色。
 *
 * 'default' / 空 / 纯黑（历史默认值 '0,0,0'，与主题包的兜底色一致）都按跟随主题处理。
 */
export function isFollowingThemeColor(color?: string): boolean {
  if (!color)
    return true
  const value = color.trim().toLowerCase()
  if (value === 'default')
    return true
  const rgb = value.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/)
  return !!rgb && Number(rgb[1]) === 0 && Number(rgb[2]) === 0 && Number(rgb[3]) === 0
}

function getDefaultSettings(): ResumeSettings {
  return {
    fontname: 'default',
    pagePadding: 36,
    pageLineHeight: 1.9,
    pageBackground: 'default',
    pageThemeColor: 'default',
    imagePosition: { top: 66, left: 391, scale: '0.8 0.8' },
    isScrollable: false,
    editorMode: 'source',
  }
}

export type { ResumeSettings }
export { getDefaultSettings }
