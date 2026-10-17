import type { MaybeRefOrGetter } from 'vue'
import { useCssVar } from '@vueuse/core'
import { toValue, watch } from 'vue'
import { fontList } from '~/constants'
import { isFollowingThemeColor } from '~/utils'

interface ResumeSettings {
  fontname: string
  pageLineHeight: number
  pagePadding: number
  pageBackground: string
  pageThemeColor: string
  imagePosition?: { left: number, top: number, scale: number | string }
}

const loadedFonts = new Set<string>()

/**
 * 将简历设置同步到 CSS 变量。
 * 只需调用一次：通过 getter 始终读取最新的 settings 对象，
 * settings 对象整体被替换（如 fetch 后）或字段变化时都会触发对应同步。
 */
export function useResumeStyleSync(
  settings: MaybeRefOrGetter<ResumeSettings | undefined>,
  el: HTMLElement = document.documentElement,
) {
  const fontFamily = useCssVar('--defaults-markdwon-family', el)
  const lineHeight = useCssVar('--resume-line-height', el)
  const pagePadding = useCssVar('--resume-page-padding-size', el)
  const pageBackground = useCssVar('--resume-page-background', el)

  /**
   * 主题色：只写「用户变量」`--resume-theme-color`，主题包里再用
   * `--resume-page-theme: var(--resume-theme-color, <主题签名色>)` 取值。
   *
   * 不能直接写 `--resume-page-theme` 到 <html> 上：主题把签名色声明在 .markdown-body
   * 元素自身，元素自身声明永远压过从祖先继承来的值（跟 !important、特异性无关），
   * 于是「改主题色没反应」。跟随主题时必须把变量**删掉**，让主题回退值生效。
   */
  function syncThemeColor(val?: string) {
    if (!val || isFollowingThemeColor(val)) {
      el.style.removeProperty('--resume-theme-color')
      el.style.removeProperty('--resume-page-theme')
      return
    }
    el.style.setProperty('--resume-theme-color', val)
    // 兼容 resume-theme ≤ 0.3.12（那版主题只认 --resume-page-theme）
    el.style.setProperty('--resume-page-theme', val)
  }

  function syncImagePositionToCSSVars(val: any) {
    const imagePositionToCSSVars = JSON.parse(typeof val === 'string' ? val : JSON.stringify(val))
    const ele = (document.querySelector('.preview-content') as HTMLElement)?.style

    if (!document.querySelector('.preview-content'))
      return
    ele.setProperty('--id-photo-top', `${imagePositionToCSSVars.top}px`)
    ele.setProperty('--id-photo-left', `${imagePositionToCSSVars.left}px`)
    // 两个方向的值必须用逗号分隔：`transform: scale(0.8 0.8)` 是非法语法，整条声明会被丢掉
    // （默认设置里就是空格分隔的 '0.8 0.8'，所以不归一化的话默认缩放根本不生效）
    ele.setProperty('--id-photo-scale', String(imagePositionToCSSVars.scale).split(/[,\s]+/).filter(Boolean).join(', '))
  }

  // 字体处理
  function updateFont(font: string) {
    // 'default' = 跟随主题：主题自带正文族（如墨韵朱红的衬线）时用它的，
    // 没有自带就回落到 common.scss 里的无衬线栈。所以这里要把变量删掉而不是写一个具体字体栈，
    // 否则主题写在自己 .markdown-body 上的字体永远被压掉（同主题色那个坑）。
    if (font === 'default') {
      el.style.removeProperty('--defaults-markdwon-family')
      return
    }
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
    pageThemeColor: (val: string) => { syncThemeColor(val) },
    imagePosition: (val: any) => {
      syncImagePositionToCSSVars(val)
    },
  }

  ;(Object.keys(fieldWatchers) as (keyof ResumeSettings)[]).forEach((key) => {
    watch(
      () => toValue(settings)?.[key],
      (val) => {
        if (val === undefined)
          return
        fieldWatchers[key](val)
      },
      // imagePosition 是对象，deep 兼容就地修改；其余为原始值
      { immediate: true, deep: key === 'imagePosition' },
    )
  })
}
