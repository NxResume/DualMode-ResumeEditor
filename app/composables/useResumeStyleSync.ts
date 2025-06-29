import type { Ref } from 'vue'
import { useCssVar } from '@vueuse/core'
// composables/useResumeStyleSync.ts
import { onMounted, watch } from 'vue'
import { fontList } from '~/constants'

interface ResumeSettings {
  fontname: string
  pageLineHeight: number
  pagePadding: number
  pageBackground: string
  pageThemeColor: string
}

// 缓存已加载字体，避免重复注册
const loadedFonts = new Set<string>()

export function useResumeStyleSync(
  settings: Ref<ResumeSettings>,
  el: HTMLElement = document.documentElement,
) {
  const fontFamily = useCssVar('--defaults-markdwon-family', el)
  const lineHeight = useCssVar('--resume-line-height', el)
  const pagePadding = useCssVar('--resume-page-padding-size', el)
  const pageBackground = useCssVar('--resume-page-background', el)
  const pageTheme = useCssVar('--resume-page-theme', el)

  // 字体处理
  function updateFont(font: string) {
    const fontInfo = fontList?.find(font => font.value === settings.value.fontname)
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

  function applyAll() {
    const s = settings.value
    updateFont(s.fontname)
    lineHeight.value = `${s.pageLineHeight}`
    pagePadding.value = `${s.pagePadding}px`
    pageBackground.value = `url(${s.pageBackground})`
    pageTheme.value = s.pageThemeColor
  }

  onMounted(() => {
    applyAll()
  })

  // 监听每个字段，按需更新
  watch(() => settings.value.fontname, updateFont, { immediate: true })
  watch(() => settings.value.pageLineHeight, (val) => {
    lineHeight.value = `${val}`
  }, { immediate: true })
  watch(() => settings.value.pagePadding, (val) => {
    pagePadding.value = `${val}px`
  }, { immediate: true })
  watch(() => settings.value.pageBackground, (val) => {
    pageBackground.value = `url(${val})`
  }, { immediate: true })
  watch(() => settings.value.pageThemeColor, (val) => {
    pageTheme.value = val
  }, { immediate: true })
}
