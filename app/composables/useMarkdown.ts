import MarkdownIt from 'markdown-it'
import remarkContainer from 'markdown-it-container'

export function useMarkdown(content: string) {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  })

  md.use(remarkContainer, 'left', {
    validate(params: string) {
      return params.trim() === 'left'
    },
    render(tokens: any[], idx: number) {
      if (tokens[idx].nesting === 1) {
        // 打开父容器 + 左容器
        return `<div class="lr-container"><div class="left">`
      }
      else {
        // 闭合左容器，并打开右容器（注意顺序）
        return `</div>`
      }
    },
  })

  // 注册右容器插件
  md.use(remarkContainer, 'right', {
    render(tokens: any[], idx: number) {
      if (tokens[idx].nesting === 1) {
        // 右容器开始标签（已在上一个容器处理）
        return '<div class="right">'
      }
      else {
        // 闭合右容器 + 父容器
        return `</div></div>`
      }
    },
  })

  return {
    html: md.render(content),
  }
}
