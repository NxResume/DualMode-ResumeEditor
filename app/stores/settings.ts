import { useStorage } from '@vueuse/core'
import { skipHydrate } from 'pinia'
import { fontList } from '~/constants'

const useSettingsStore = defineStore('settings', () => {
  const isScrollable = useStorage('nuxt-resume-editor-isScrollable', false)
  const fontname = useStorage('nuxt-resume-editor-fontname', 'default')
  const editorMode = useStorage<'source' | 'wysiwyg'>('nuxt-resume-editor-editorMode', 'source')
  const pageBackground = useStorage('nuxt-resume-page-background-image', 'default')
  const pageThemeColor = useStorage('nuxt-resume-page-theme-color', '0,0,0')
  const pagePadding = useStorage('nuxt-resume-editor-pagePadding', 36)

  const fontMap = computed(() => {
    return fontList?.find(font => font.value === fontname.value)
  })

  const loadFont = () => {
    if (!fontMap.value)
      return

    if (fontMap.value.assets) {
      // Load custom font
      const fontFace = new FontFace(fontMap.value.value, `url(${fontMap.value.assets})`)
      fontFace.load().then(() => {
        document.fonts.add(fontFace)
        document.documentElement.style.setProperty('--defaults-markdwon-family', fontMap.value!.value)
      })
    }
    else if (fontMap.value.fontFamily) {
      // Use system font
      document.documentElement.style.setProperty('--defaults-markdwon-family', fontMap.value.fontFamily)
    }
  }

  const loadPagePadding = () => {
    document.documentElement.style.setProperty('--resume-page-padding-size', `${pagePadding.value}px`)
  }

  const loadPageBackground = () => {
    document.documentElement.style.setProperty('--resume-page-background', `url(${pageBackground.value})`)
  }

  const loadPageTheme = () => {
    document.documentElement.style.setProperty('--resume-page-theme', pageThemeColor.value)
  }

  watch(fontname, () => {
    loadFont()
  })

  watch(pagePadding, () => {
    loadPagePadding()
  })

  watch(pageBackground, () => {
    loadPageBackground()
  })

  watch(pageThemeColor, () => {
    loadPageTheme()
  })

  onMounted(() => {
    loadFont()
    loadPagePadding()
    loadPageBackground()
    loadPageTheme()
  })

  return {
    isScrollable: skipHydrate(isScrollable),
    fontname: skipHydrate(fontname),
    editorMode: skipHydrate(editorMode),
    pagePadding: skipHydrate(pagePadding),
    pageBackground: skipHydrate(pageBackground),
    pageThemeColor: skipHydrate(pageThemeColor),
    fontMap,
    loadFont,
  }
})

export default useSettingsStore
