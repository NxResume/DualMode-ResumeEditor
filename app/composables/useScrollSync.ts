// 调用方可能传模板 ref，也可能传组件实例 ref；这里只读取 .value，用宽松类型避免无意义的泛型约束
type MaybeElRef = Ref<any>

interface Anchor {
  /** 源码行号（1-based，与 CodeMirror / data-source-line 一致） */
  line: number
  /** 相对滚动容器内容顶部的 Y（布局坐标，已按 scale 校正） */
  y: number
}

/**
 * 找出真正发生滚动的元素。
 * - 编辑区（source 模式）：CodeMirror 高度受限于容器，滚动发生在内部 .cm-scroller；
 * - 编辑区（wysiwyg 模式）：滚动发生在 contenteditable 的 .prose 上；
 * - 预览区：列本身就是滚动容器（.rs-page-item 自身 overflow:hidden，不参与滚动）。
 * 都不满足时回退到容器自身。
 */
function findScroller(root: HTMLElement | null): HTMLElement | null {
  if (!root)
    return null
  const inner = root.querySelector<HTMLElement>('.cm-scroller, [contenteditable="true"]')
  if (inner && inner.scrollHeight > inner.clientHeight + 1)
    return inner
  return root
}

function scrollRange(el: HTMLElement): number {
  return Math.max(0, el.scrollHeight - el.clientHeight)
}

/**
 * 预览区用 CSS scale 缩放纸张：getBoundingClientRect 是视觉坐标，
 * scrollTop 是布局坐标。把视觉差值除以 scale 再加 scrollTop，才能对齐。
 */
function getContentScale(scroller: HTMLElement): number {
  const scaler = scroller.querySelector('.preview-scaler') as HTMLElement | null
  if (scaler) {
    const raw = getComputedStyle(scaler).scale
    if (raw && raw !== 'none') {
      const n = Number.parseFloat(raw)
      if (Number.isFinite(n) && n > 0)
        return n
    }
  }
  const page = scroller.querySelector('.rs-page-item') as HTMLElement | null
  if (page && page.offsetWidth > 0) {
    const visual = page.getBoundingClientRect().width
    if (visual > 0)
      return visual / page.offsetWidth
  }
  return 1
}

/** 元素顶边相对滚动容器内容顶的布局 Y */
function contentY(el: HTMLElement, scroller: HTMLElement): number {
  const scale = getContentScale(scroller)
  return (el.getBoundingClientRect().top - scroller.getBoundingClientRect().top) / scale + scroller.scrollTop
}

/** 预览侧：markdown 渲染写入的 data-source-line */
function collectPreviewAnchors(scroller: HTMLElement): Anchor[] {
  const nodes = scroller.querySelectorAll<HTMLElement>('[data-source-line]')
  const byLine = new Map<number, number>()
  for (const el of nodes) {
    const line = Number(el.getAttribute('data-source-line'))
    if (!Number.isFinite(line) || line < 1)
      continue
    const y = contentY(el, scroller)
    // 同一行可能因列表跨页拆成多块：取最靠上的一块
    const prev = byLine.get(line)
    if (prev === undefined || y < prev)
      byLine.set(line, y)
  }
  return [...byLine.entries()]
    .map(([line, y]) => ({ line, y }))
    .sort((a, b) => a.line - b.line || a.y - b.y)
}

/** 编辑器侧：用与预览相同的行号去取 .cm-line */
function collectEditorAnchors(scroller: HTMLElement, lines: Iterable<number>): Anchor[] {
  const cmLines = scroller.querySelectorAll<HTMLElement>('.cm-line')
  if (!cmLines.length)
    return []
  const anchors: Anchor[] = []
  for (const line of lines) {
    const el = cmLines[line - 1]
    if (!el)
      continue
    anchors.push({ line, y: contentY(el, scroller) })
  }
  return anchors.sort((a, b) => a.line - b.line || a.y - b.y)
}

function syncByRatio(from: HTMLElement, to: HTMLElement) {
  const fromMax = scrollRange(from)
  const ratio = fromMax > 0 ? from.scrollTop / fromMax : 0
  to.scrollTop = ratio * scrollRange(to)
}

/**
 * 在两侧共有的源码行锚点之间做局部插值。
 * 预览有分页间隙 / 页边距 / 缩放，编辑器是匀密行高 —— 全局 scrollTop 比例会对不齐，
 * 按「同一段 markdown 行」对齐后，分页空白自然被吸收进锚点间距。
 */
function syncByAnchors(from: HTMLElement, to: HTMLElement, fromIsEditor: boolean) {
  const editor = fromIsEditor ? from : to
  const preview = fromIsEditor ? to : from

  const previewAnchors = collectPreviewAnchors(preview)
  if (previewAnchors.length === 0) {
    syncByRatio(from, to)
    return
  }

  const editorAnchors = collectEditorAnchors(
    editor,
    previewAnchors.map(a => a.line),
  )
  if (editorAnchors.length === 0) {
    // wysiwyg 或尚无 .cm-line：退回比例
    syncByRatio(from, to)
    return
  }

  const toByLine = new Map(
    (fromIsEditor ? previewAnchors : editorAnchors).map(a => [a.line, a.y]),
  )
  const fromAnchors = fromIsEditor ? editorAnchors : previewAnchors

  const pairs: { fromY: number, toY: number }[] = []
  for (const a of fromAnchors) {
    const toY = toByLine.get(a.line)
    if (toY === undefined)
      continue
    pairs.push({ fromY: a.y, toY })
  }

  if (pairs.length === 0) {
    syncByRatio(from, to)
    return
  }

  // 视口上方约 20% 处作为对齐参考点（避开顶栏抖动）
  const focusOffset = from.clientHeight * 0.2
  const focusY = from.scrollTop + focusOffset

  let i = 0
  while (i < pairs.length - 1 && pairs[i + 1]!.fromY <= focusY)
    i++

  let targetY: number
  if (pairs.length === 1 || i >= pairs.length - 1) {
    const p = pairs[Math.min(i, pairs.length - 1)]!
    targetY = p.toY + (focusY - p.fromY)
  }
  else {
    const a = pairs[i]!
    const b = pairs[i + 1]!
    const span = b.fromY - a.fromY
    const t = span > 0 ? (focusY - a.fromY) / span : 0
    targetY = a.toY + t * (b.toY - a.toY)
  }

  const max = scrollRange(to)
  to.scrollTop = Math.min(max, Math.max(0, targetY - to.clientHeight * 0.2))
}

export function useScrollSync(leftRef: MaybeElRef, rightRef: MaybeElRef) {
  let isSyncing = false
  let started = false

  /** 把 fromRoot 的滚动位置同步给 toRoot（优先锚点，否则比例） */
  function syncFrom(fromRoot: HTMLElement | null, toRoot: HTMLElement | null, fromIsEditor: boolean) {
    if (isSyncing || !fromRoot || !toRoot)
      return

    const from = findScroller(fromRoot)
    const to = findScroller(toRoot)
    if (!from || !to)
      return

    isSyncing = true
    try {
      syncByAnchors(from, to, fromIsEditor)
    }
    finally {
      // scrollTop 赋值会同步触发对侧 scroll；保持标志直到本轮结束即可挡住回声
      isSyncing = false
    }
  }

  // scroll 事件不冒泡，但会在**捕获阶段**经过祖先元素：挂在列容器上用捕获，
  // 既能收到内部 .cm-scroller 的滚动，也不会因为内部编辑器 DOM 被重建（切换 source / wysiwyg）而丢监听。
  // 只响应「真正在滚的那个元素」发出的事件，避免内容里的横向滚动（表格/代码块）误触发。
  const onLeftScroll = (e: Event) => {
    const root = leftRef.value
    if (!root || e.target !== findScroller(root))
      return
    syncFrom(root, rightRef.value, true)
  }

  const onRightScroll = (e: Event) => {
    const root = rightRef.value
    if (!root || e.target !== findScroller(root))
      return
    syncFrom(root, leftRef.value, false)
  }

  const listenOptions: AddEventListenerOptions = { capture: true }

  function start() {
    // 幂等：isScrollable 反复切换时不会挂上重复监听
    if (started)
      return
    // 容器还没挂载时（setup 阶段 immediate watch）不要置位，否则后续调用会被幂等判断挡掉、
    // 监听永远挂不上 —— 由调用方在 onMounted 后再调一次。
    const left = leftRef.value
    const right = rightRef.value
    if (!left || !right)
      return
    started = true
    left.addEventListener('scroll', onLeftScroll, listenOptions)
    right.addEventListener('scroll', onRightScroll, listenOptions)
  }

  function stop() {
    if (!started)
      return
    started = false
    leftRef.value?.removeEventListener('scroll', onLeftScroll, listenOptions)
    rightRef.value?.removeEventListener('scroll', onRightScroll, listenOptions)
  }

  return { start, stop }
}
