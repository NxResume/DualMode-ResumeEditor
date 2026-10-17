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

/**
 * 一趟锚点收集的公共只读上下文：scale 与容器 rect 在同一趟内不变，
 * 提前算一次而不是每个锚点算一次（getComputedStyle / gBCR 都会强制布局，
 * 乘上锚点数 × 每帧滚动事件就是肉眼可见的卡顿）。
 */
interface PassContext {
  scroller: HTMLElement
  scale: number
  baseTop: number
  scrollTop: number
}

function makePassContext(scroller: HTMLElement): PassContext {
  return {
    scroller,
    scale: getContentScale(scroller),
    baseTop: scroller.getBoundingClientRect().top,
    scrollTop: scroller.scrollTop,
  }
}

/** 元素顶边相对滚动容器内容顶的布局 Y */
function contentY(el: HTMLElement, ctx: PassContext): number {
  return (el.getBoundingClientRect().top - ctx.baseTop) / ctx.scale + ctx.scrollTop
}

/** 预览侧：markdown 渲染写入的 data-source-line */
function collectPreviewAnchors(scroller: HTMLElement): Anchor[] {
  const nodes = scroller.querySelectorAll<HTMLElement>('[data-source-line]')
  if (!nodes.length)
    return []
  const ctx = makePassContext(scroller)
  const byLine = new Map<number, number>()
  for (const el of nodes) {
    const line = Number(el.getAttribute('data-source-line'))
    if (!Number.isFinite(line) || line < 1)
      continue
    const y = contentY(el, ctx)
    // 同一行可能因列表跨页拆成多块：取最靠上的一块
    const prev = byLine.get(line)
    if (prev === undefined || y < prev)
      byLine.set(line, y)
  }
  return [...byLine.entries()]
    .map(([line, y]) => ({ line, y }))
    .sort((a, b) => a.line - b.line || a.y - b.y)
}

/**
 * 编辑器侧：读 CodeMirror 扩展标注的 data-cm-line（真实文档行号）。
 * 不能用 NodeList 下标推行号：CM6 虚拟渲染下 DOM 只含视口窗口内的行，
 * 滚动后下标与行号整体错位（未渲染的行没有该属性，自然被跳过）。
 */
function collectEditorAnchors(scroller: HTMLElement, lines: Iterable<number>): Anchor[] {
  const wanted = new Set(lines)
  const cmLines = scroller.querySelectorAll<HTMLElement>('.cm-line[data-cm-line]')
  if (!cmLines.length)
    return []
  const ctx = makePassContext(scroller)
  const anchors: Anchor[] = []
  for (const el of cmLines) {
    const line = Number(el.getAttribute('data-cm-line'))
    if (!wanted.has(line))
      continue
    anchors.push({ line, y: contentY(el, ctx) })
  }
  return anchors.sort((a, b) => a.line - b.line || a.y - b.y)
}

function targetByRatio(from: HTMLElement, to: HTMLElement): number {
  const fromMax = scrollRange(from)
  const ratio = fromMax > 0 ? from.scrollTop / fromMax : 0
  return ratio * scrollRange(to)
}

/**
 * 在两侧共有的源码行锚点之间做局部插值。
 * 预览有分页间隙 / 页边距 / 缩放，编辑器是匀密行高 —— 全局 scrollTop 比例会对不齐，
 * 按「同一段 markdown 行」对齐后，分页空白自然被吸收进锚点间距。
 * 返回 to 侧的目标 scrollTop（不写入）。
 */
function targetByAnchors(from: HTMLElement, to: HTMLElement, fromIsEditor: boolean): number {
  const editor = fromIsEditor ? from : to
  const preview = fromIsEditor ? to : from

  const previewAnchors = collectPreviewAnchors(preview)
  const editorAnchors = previewAnchors.length
    ? collectEditorAnchors(editor, previewAnchors.map(a => a.line))
    : []
  // wysiwyg 或尚无 .cm-line / 预览无锚点：退回比例
  if (!previewAnchors.length || !editorAnchors.length)
    return targetByRatio(from, to)

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

  if (pairs.length === 0)
    return targetByRatio(from, to)

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

  return targetY - to.clientHeight * 0.2
}

/** 回声判定窗口：程序写入后这段时间内、对侧 scrollTop 仍停在期望值附近的事件视为回声 */
const ECHO_WINDOW_MS = 150
const ECHO_TOLERANCE_PX = 2
/** 小于该值的位移不值得写 scrollTop（也避免亚像素抖动再派发 scroll 事件） */
const APPLY_EPSILON_PX = 0.5

export function useScrollSync(leftRef: MaybeElRef, rightRef: MaybeElRef) {
  let started = false
  /** 待执行的同步（一帧最多跑一次，最新发起的方向胜出） */
  let pending: (() => void) | null = null
  let rafId: number | null = null
  /**
   * 最近一次程序写入的期望值。scrollTop 赋值触发的对侧 scroll 事件是异步派发的，
   * 布尔标志在事件到达前就被清掉、挡不住回声；按「元素 + 期望值 + 时间窗」识别，
   * 用户在窗口内真的滚了对侧（值偏离期望）则照常处理，不会被误吞。
   */
  let programmatic: { el: HTMLElement, top: number, at: number } | null = null

  function isEcho(scroller: HTMLElement): boolean {
    return !!programmatic
      && programmatic.el === scroller
      && performance.now() - programmatic.at < ECHO_WINDOW_MS
      && Math.abs(scroller.scrollTop - programmatic.top) <= ECHO_TOLERANCE_PX
  }

  /** 把 fromRoot 的滚动位置同步给 toRoot（优先锚点，否则比例） */
  function syncFrom(fromRoot: HTMLElement | null, toRoot: HTMLElement | null, fromIsEditor: boolean) {
    if (!fromRoot || !toRoot)
      return

    const from = findScroller(fromRoot)
    const to = findScroller(toRoot)
    if (!from || !to)
      return

    const target = targetByAnchors(from, to, fromIsEditor)
    const clamped = Math.min(scrollRange(to), Math.max(0, target))
    if (Math.abs(to.scrollTop - clamped) <= APPLY_EPSILON_PX)
      return
    to.scrollTop = clamped
    programmatic = { el: to, top: clamped, at: performance.now() }
  }

  /** 滚动事件按帧合并：快速滚动时一帧只做一次锚点收集，而不是每个事件都做 */
  function schedule(fn: () => void) {
    pending = fn
    if (rafId !== null)
      return
    rafId = requestAnimationFrame(() => {
      rafId = null
      const task = pending
      pending = null
      task?.()
    })
  }

  // scroll 事件不冒泡，但会在**捕获阶段**经过祖先元素：挂在列容器上用捕获，
  // 既能收到内部 .cm-scroller 的滚动，也不会因为内部编辑器 DOM 被重建（切换 source / wysiwyg）而丢监听。
  // 只响应「真正在滚的那个元素」发出的事件，避免内容里的横向滚动（表格/代码块）误触发。
  const onLeftScroll = (e: Event) => {
    const root = leftRef.value
    if (!root)
      return
    const scroller = findScroller(root)
    if (!scroller || e.target !== scroller || isEcho(scroller))
      return
    schedule(() => syncFrom(root, rightRef.value, true))
  }

  const onRightScroll = (e: Event) => {
    const root = rightRef.value
    if (!root)
      return
    const scroller = findScroller(root)
    if (!scroller || e.target !== scroller || isEcho(scroller))
      return
    schedule(() => syncFrom(root, leftRef.value, false))
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
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    pending = null
    if (!started)
      return
    started = false
    leftRef.value?.removeEventListener('scroll', onLeftScroll, listenOptions)
    rightRef.value?.removeEventListener('scroll', onRightScroll, listenOptions)
  }

  return { start, stop }
}
