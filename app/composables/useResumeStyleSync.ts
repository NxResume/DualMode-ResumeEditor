import type { Reactive } from 'vue'
import { useCssVar } from '@vueuse/core'
import { watch } from 'vue'
import { fontList } from '~/constants'

interface ResumeSettings {
  fontname: string
  pageLineHeight: number
  pagePadding: number
  pageBackground: string
  pageThemeColor: string
  imagePosition?: { left: number, top: number, scale: number | string }
}

const loadedFonts = new Set<string>()

export function useResumeStyleSync(
  settings: Reactive<ResumeSettings>,
  el: HTMLElement = document.documentElement,
) {
  const fontFamily = useCssVar('--defaults-markdwon-family', el)
  const lineHeight = useCssVar('--resume-line-height', el)
  const pagePadding = useCssVar('--resume-page-padding-size', el)
  const pageBackground = useCssVar('--resume-page-background', el)
  const pageTheme = useCssVar('--resume-page-theme', el)

  function syncImagePositionToCSSVars(val: any) {
    const imagePositionToCSSVars = JSON.parse(typeof val === 'string' ? val : JSON.stringify(val))
    const ele = (document.querySelector('.preview-content') as HTMLElement)?.style

    if (!document.querySelector('.preview-content'))
      return
    ele.setProperty('--id-photo-top', `${imagePositionToCSSVars.top}px`)
    ele.setProperty('--id-photo-left', `${imagePositionToCSSVars.left}px`)
    ele.setProperty('--id-photo-scale', imagePositionToCSSVars.scale.toString())
  }

  // 字体处理
  function updateFont(font: string) {
    const fontInfo = fontList?.find(fontItem => fontItem.value === font)
    if (!fontInfo) {
      fontFamily.value = font
      return
    }
    if (fontInfo.assets && !loadedFonts.has(fontInfo.value)) {
      const fontFace = new FontFace(fontInfo.value, `url(${fontInfo.assets})`)
      fontFace.load().then(() => {
        document.fonts.add(fontFace)
        loadedFonts.add(fontInfo.value)
        fontFamily.value = fontInfo.value
      }).catch((err) => {
        console.warn('Font load failed:', err)
      })
    }
    else if (fontInfo.fontFamily) {
      fontFamily.value = fontInfo.fontFamily
    }
    else {
      fontFamily.value = fontInfo.value
    }
  }

  const fieldWatchers: Record<keyof ResumeSettings, (val: any) => void> = {
    fontname: updateFont,
    pageLineHeight: (val: number) => { lineHeight.value = `${val}` },
    pagePadding: (val: number) => { pagePadding.value = `${val}px` },
    pageBackground: (val: string) => { pageBackground.value = `url(${val})` },
    pageThemeColor: (val: string) => { pageTheme.value = val },
    imagePosition: (val: any) => {
      syncImagePositionToCSSVars(val)
    },
  }

  Object.keys(fieldWatchers).forEach((key) => {
    watch(() => settings[key as keyof ResumeSettings], fieldWatchers[key as keyof ResumeSettings], { immediate: true })
  })
}
