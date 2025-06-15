import type MarkdownIt from 'markdown-it'
import { icons } from '@iconify-json/ri'

import { getIconData, iconToHTML, iconToSVG, replaceIDs } from '@iconify/utils'
import { coreRuler, rendererRule } from 'markdown-it-regex'

/**
 * markdown-it 图标插件
 * 支持格式:
 * "icon:图标类名" -> <img src="https://api.iconify.design/图标类名.svg" />
 */
export default function iconPlugin(md: MarkdownIt, {
  type = 'original',
}: {
  type?: 'original' | 'svg'
}): void {
  const getIconHtml = (match: string) => {
    if (type === 'original') {
      const iconClass = match.replace('icon:', '') // 使用 replace 来移除前缀
      return `<img class='icon-md' src="https://api.iconify.design/${iconClass}.svg?color=%23747474" alt="${iconClass}" />`
    }

    const svgName = match.replace('ri/', '')
    return getIconSVG(svgName)
  }
  const options = {
    name: 'icon',
    regex: /icon:([a-zA-Z0-9-/]+)/,
    replace: (match: string) => {
      return getIconHtml(match)
    },
  }

  // 注册渲染规则
  md.renderer.rules[options.name] = (tokens, idx) => {
    return rendererRule(tokens, idx, options)
  }

  // 注册核心规则
  md.core.ruler.push(options.name, (state) => {
    coreRuler(state, options)
  })
}

/**
 * Function to get the SVG for an icon by its name.
 * @param iconName The name of the icon to retrieve the SVG for.
 * @returns A string of the SVG markup for the icon.
 */
function getIconSVG(iconName: string): string {
  // Get content for icon
  const iconData = getIconData(icons, iconName)
  if (!iconData) {
    throw new Error(`Icon "${iconName}" is missing`)
  }

  // Use it to render icon
  const renderData = iconToSVG(iconData, {
    height: 'auto',
  })

  // Modify the SVG attributes to include the custom class
  const attributesWithClass = {
    ...renderData.attributes,
    class: 'md-icon-svg',
  }

  // Generate SVG string
  const svg = iconToHTML(replaceIDs(renderData.body), attributesWithClass)
  return svg
}
