import MarkdownIt from 'markdown-it'
import remarkContainer from 'markdown-it-container'
import iconPlugin from '~/utils/markdown-it-icon'

// 模块级单例：MarkdownIt 实例与插件只创建一次。
// render() 本身无状态，重复使用同一实例输出与每次新建完全一致，
// 避免每次内容变化（每个按键）都重建实例并重新注册插件。
let md: MarkdownIt | null = null

function getMd(): MarkdownIt {
  if (md)
    return md

  md = new MarkdownIt({
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

  return md
}

export function useMarkdown(content?: string) {
  if (!content) {
    return {
      html: '',
    }
  }

  return {
    html: getMd().render(content),
  }
}
