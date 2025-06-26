import type { Ref } from 'vue'
// composables/useResumeStyleSync.ts
import { onMounted, onUnmounted, watch } from 'vue'
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
  // 字体处理
  function updateFont(font: string) {
    const fontInfo = fontList?.find(font => font.value === settings.value.fontname)
    if (!fontInfo) {
      el.style.setProperty('--defaults-markdwon-family', font)
      return
    }

    if (fontInfo.assets && !loadedFonts.has(fontInfo.value)) {
      const fontFace = new FontFace(fontInfo.value, `url(${fontInfo.assets})`)
      fontFace.load().then(() => {
        document.fonts.add(fontFace)
        loadedFonts.add(fontInfo.value)
        el.style.setProperty('--defaults-markdwon-family', fontInfo.value)
      }).catch((err) => {
        console.warn('Font load failed:', err)
      })
    }
    else if (fontInfo.fontFamily) {
      el.style.setProperty('--defaults-markdwon-family', fontInfo.fontFamily)
    }
    else {
      el.style.setProperty('--defaults-markdwon-family', fontInfo.value)
    }
  }

  function applyAll() {
    const s = settings.value
    updateFont(s.fontname)
    el.style.setProperty('--resume-line-height', `${s.pageLineHeight}`)
    el.style.setProperty('--resume-page-padding-size', `${s.pagePadding}px`)
    el.style.setProperty('--resume-page-background', `url(${s.pageBackground})`)
    el.style.setProperty('--resume-page-theme', s.pageThemeColor)
  }

  onMounted(() => {
    applyAll()
  })

  // 监听每个字段，按需更新
  watch(() => settings.value.fontname, updateFont, { immediate: true })
  watch(() => settings.value.pageLineHeight, (val) => {
    el.style.setProperty('--resume-line-height', `${val}`)
  }, { immediate: true })
  watch(() => settings.value.pagePadding, (val) => {
    el.style.setProperty('--resume-page-padding-size', `${val}px`)
  }, { immediate: true })
  watch(() => settings.value.pageBackground, (val) => {
    el.style.setProperty('--resume-page-background', `url(${val})`)
  }, { immediate: true })
  watch(() => settings.value.pageThemeColor, (val) => {
    el.style.setProperty('--resume-page-theme', val)
  }, { immediate: true })

  // 清理
  onUnmounted(() => {
    const vars = [
      '--defaults-markdwon-family',
      '--resume-line-height',
      '--resume-page-padding-size',
      '--resume-page-background',
      '--resume-page-theme',
    ]
    for (const v of vars)
      el.style.removeProperty(v)
  })
}
