import MarkdownIt from 'markdown-it'
import remarkContainer from 'markdown-it-container'
import gapPlugin from '~/utils/markdown-it-gap'
import iconPlugin from '~/utils/markdown-it-icon'

// 模块级单例：MarkdownIt 实例与插件只创建一次。
// render() 本身无状态，重复使用同一实例输出与每次新建完全一致，
// 避免每次内容变化（每个按键）都重建实例并重新注册插件。
let md: MarkdownIt | null = null

/**
 * 给块级 token 打上 data-source-line（1-based），供编辑/预览滚动按内容对齐。
 * markdown-it 的 map 是 0-based 源码行区间；与 CodeMirror .cm-line 下标+1 一致。
 * 自定义 container 的 render 直接写死 HTML，不会带上 attrs —— 标题/段落/列表项足够做锚点。
 */
function sourceLinePlugin(instance: MarkdownIt) {
  instance.core.ruler.push('source_line_attr', (state) => {
    for (const token of state.tokens) {
      if (!token.map || token.nesting === -1)
        continue
      token.attrSet('data-source-line', String(token.map[0] + 1))
    }
  })
}

function getMd(): MarkdownIt {
  if (md)
    return md

  md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  })

  // `::: left` 负责打开 .lr-container、`::: right` 负责关上它 —— 这一对必须**成对且相邻**。
  // 只留一半（例如把 `::: right` 那块剪掉）时，容器会一直开着：它的 overflow:hidden 会把后面
  // 整篇内容吞进去并裁掉（表现就是「后面的内容全不见了」）。所以这里用 token 相邻性判断是否配成对，
  // 不成对时让每个容器各自闭合。
  const isPairedWithRight = (tokens: any[], idx: number) =>
    tokens[idx + 1]?.type === 'container_right_open'

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
        // 关闭 left 容器：后面紧跟 ::: right 时容器留给 right 关；否则自己把容器一起关掉
        return isPairedWithRight(tokens, idx) ? '</div>' : '</div></div>'
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
        // 前一个 token 是 `::: left` 的关闭标记 → 复用它打开的容器；否则自己开一个
        return tokens[idx - 1]?.type === 'container_left_close'
          ? '<div class="right">'
          : '<div class="lr-container"><div class="right">'
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

  // 空行 → 真实留白（连续空行里第一个只作段落分隔，多出来的每个补一行空白）
  md.use(gapPlugin)

  md.use(sourceLinePlugin)

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
