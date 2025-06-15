import MarkdownIt from 'markdown-it'
import remarkContainer from 'markdown-it-container'
import iconPlugin from '~/utils/markdown-it-icon'

export function useMarkdown(content: string) {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  })

  md.use(remarkContainer, 'left', {
    validate(params: string) {
      return params.trim() === 'left'
    },
    render(tokens: any[], idx: number) {
      // 判断容器是开始还是结束
      if (tokens[idx].nesting === 1) {
        // 打开 lr-container 和 left 容器
        return '<div class="lr-container"><div class="left">'
      }
      else {
        // 关闭 left 容器
        return '</div>'
      }
    },
  })

  // 注册右容器插件
  md.use(remarkContainer, 'right', {
    validate(params: string) {
      return params.trim() === 'right'
    },
    render(tokens: any[], idx: number) {
      // 判断容器是开始还是结束
      if (tokens[idx].nesting === 1) {
        // 打开 right 容器
        return '<div class="right">'
      }
      else {
        // 关闭 right 容器，并且关闭 lr-container
        return '</div></div>'
      }
    },
  })

  md.use(iconPlugin, {
    type: 'svg',
  })

  return {
    html: md.render(content),
  }
}
