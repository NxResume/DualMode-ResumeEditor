import { useStorage } from '@vueuse/core'
import { skipHydrate } from 'pinia'
import { fontList } from '~/constants'

const useSettingsStore = defineStore('settings', () => {
  const isScrollable = useStorage('nuxt-resume-editor-isScrollable', false)
  const fontname = useStorage('nuxt-resume-editor-fontname', 'default')
  const editorMode = useStorage<'source' | 'wysiwyg'>('nuxt-resume-editor-editorMode', 'source')

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

  watch(fontname, () => {
    loadFont()
  })

  return {
    isScrollable: skipHydrate(isScrollable),
    fontname: skipHydrate(fontname),
    editorMode: skipHydrate(editorMode),
    fontMap,
    loadFont,
  }
})

export default useSettingsStore
