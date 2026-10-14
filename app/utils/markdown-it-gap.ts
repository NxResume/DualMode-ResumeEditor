import type MarkdownIt from 'markdown-it'

/** 一个空白块 = 一个行盒的高度（样式在 MarkdownContentPreview.vue 的全局 CSS 里） */
const GAP_HTML = '<div class="md-gap"></div>'

interface BlankRun {
  /** 空行串的起始行 */
  startLine: number
  /** 空行串之后的第一行（挂载阈值） */
  endLine: number
  /** 应产生的空白块数量 */
  gaps: number
}

/** 只用到 token 的两个字段，避免依赖 markdown-it 的具体类型导出 */
interface MappedToken {
  nesting: number
  map?: number[] | null
}

/**
 * 找出源文件里所有「连续 2 行及以上」的空行串。
 * 口径：第一个空行只作段落分隔，多出来的每个算一行空白（n 个空行 → n−1 行空白）。
 */
function collectBlankRuns(src: string): BlankRun[] {
  const lines = src.split('\n')
  const runs: BlankRun[] = []

  let i = 0
  while (i < lines.length) {
    if ((lines[i] ?? '').trim() !== '') {
      i++
      continue
    }
    const startLine = i
    while (i < lines.length && (lines[i] ?? '').trim() === '')
      i++
    const blanks = i - startLine
    if (blanks >= 2)
      runs.push({ startLine, endLine: i, gaps: blanks - 1 })
  }
  return runs
}

/**
 * 空行串是否整体落在「原子块」里（代码块 / 原始 HTML 块 / 缩进代码块）。
 * 这类块内部的空行属于内容本身，不能补成空白块。
 * 列表、引用、`:::` 容器是 nesting === 1 的容器，不算原子块 —— 它们内部的空行照样生效。
 */
function isInsideAtomicBlock(tokens: readonly MappedToken[], run: BlankRun): boolean {
  return tokens.some(token =>
    token.nesting !== 1
    && token.map
    && token.map[0]! <= run.startLine
    && token.map[1]! >= run.endLine,
  )
}

/**
 * 空行 → 真实留白。
 *
 * markdown-it 的块解析把空行吃掉了（不给任何 token），所以 `A\n\nB` 与 `A\n\n\n\nB`
 * 在预览里一模一样，编辑器里因此无法靠空行留白。本插件从**源文件**里找出连续空行串，
 * 在它后面第一个块级 token 前补出空白块。
 *
 * 为什么不用 token 的 map 行号差来数空行：markdown-it 的列表 / 容器 token 的 map 末端
 * 会把紧随其后的空行一并吞掉（`- a\n- b\n\n\n## 标题` 里 bullet_list_open 的 map 是 [0,4]，
 * 两行空行被算进列表范围），按行号做差会得出「两块之间 0 个空行」→ 空行失效。
 *
 * 口径：连续空行里第一个只作段落分隔，多出来的每个补一行空白（n 个空行 → n−1 行空白）——
 * 这样段落之间那一个空行的语义不变，既有简历排版不受影响。
 * 空行串落在列表项之间、`::: left/right` 容器内部时，空白块也插在容器内部对应位置；
 * 文件末尾的连续空行不产生空白（后面没有内容可推，留白无意义）。
 */
export default function gapPlugin(md: MarkdownIt) {
  md.core.ruler.push('blank_line_gap', (state) => {
    const runs = collectBlankRuns(state.src)
    if (!runs.length)
      return

    const out: typeof state.tokens = []
    let next = 0

    for (const token of state.tokens) {
      // 块起始 token（有 map 且不是闭合 token）是挂载点：
      // 把落在它之前的空行串补成插在它前面的空白块
      if (token.map && token.nesting >= 0) {
        while (next < runs.length && runs[next]!.endLine <= token.map[0]!) {
          const run = runs[next]!
          if (!isInsideAtomicBlock(state.tokens, run)) {
            for (let i = 0; i < run.gaps; i++) {
              const gap = new state.Token('md_gap', '', 0)
              gap.block = true
              gap.level = token.level
              out.push(gap)
            }
          }
          next++
        }
      }
      out.push(token)
    }

    state.tokens = out
  })

  md.renderer.rules.md_gap = () => GAP_HTML
}
