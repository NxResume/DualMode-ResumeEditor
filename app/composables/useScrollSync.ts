// 调用方可能传模板 ref，也可能传组件实例 ref；这里只读取 .value，用宽松类型避免无意义的泛型约束
type MaybeElRef = Ref<any>

interface Anchor {
  /** 源码行号（1-based，与 CodeMirror / data-source-line 一致） */
  line: number
  /** 相对滚动容器内容顶部的 Y（与 scrollTop 同一坐标系） */
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
 * 元素顶边相对滚动容器内容顶的 Y。
 *
 * 预览区用 CSS scale 缩放纸张，但**滚动容器本身不在 transform 里**（.preview-stage
 * 包着 .preview-scaler），所以它的 scrollTop / scrollHeight 都是缩放后的视觉像素，
 * 与 getBoundingClientRect 同一坐标系 —— 直接相加即可，不要再除以 scale。
 * （旧实现按「scrollTop 是布局坐标」除以 scale，缩放不是 100% 时锚点整体错位：
 *  140% 时同一条源码行在两侧视口的偏差就有 200px+，200% 时到 550px。）
 */
interface PassContext {
  baseTop: number
  scrollTop: number
}

function makePassContext(scroller: HTMLElement): PassContext {
  return {
    baseTop: scroller.getBoundingClientRect().top,
    scrollTop: scroller.scrollTop,
  }
}

/** 元素顶边相对滚动容器内容顶的布局 Y */
function contentY(el: HTMLElement, ctx: PassContext): number {
  return el.getBoundingClientRect().top - ctx.baseTop + ctx.scrollTop
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
 * 预览侧「内容真正结束」的 Y（与 scrollTop 同一坐标系）。
 * 不能直接用 scrollHeight：它含画布底部内边距与末页未填满的空白，
 * 拿它当结尾会让预览滚进死区（右侧多出一大段空白）。
 * 取最后一个 markdown 块（data-source-line）的底边。
 */
function previewContentEndY(scroller: HTMLElement): number {
  const nodes = scroller.querySelectorAll<HTMLElement>('[data-source-line]')
  const baseTop = scroller.getBoundingClientRect().top
  for (let i = nodes.length - 1; i >= 0; i--) {
    const rect = nodes[i]!.getBoundingClientRect()
    if (rect.height > 0)
      return rect.bottom - baseTop + scroller.scrollTop
  }
  return scroller.scrollHeight
}

/**
 * 该侧「文档结尾」对应的 scrollTop。
 * - 编辑器：滚动范围紧贴内容（CM6 的 scrollHeight 就是文档高度），直接取 scrollRange；
 * - 预览：分页间隙 / 末页留白 / 画布内边距都算在 scrollHeight 里，必须用内容真正的结束位置，
 *   否则「到底」会停在最后一行之下的一大段空白上。
 */
function endScrollTop(scroller: HTMLElement, isEditor: boolean): number {
  const max = scrollRange(scroller)
  if (isEditor)
    return max
  return Math.min(max, Math.max(0, previewContentEndY(scroller) - scroller.clientHeight))
}

/**
 * 末端对齐：把 from 末端半个视口内的锚点结果，线性过渡到「to 的文档结尾」。
 *
 * 锚点插值只能吸收**两个锚点之间**的间距，而文档末尾这段后面再没有锚点可依：
 * 预览的分页间隙、页边距、末页剩余空白全部堆在最后一个锚点之后。两侧内容在尾部的
 * 「密度」又必然不同（预览行距/分页 vs 编辑器匀密行高），于是 from 滚到底时
 * to 还差一截（行距越大差得越多）—— 就是「左边到底了、右边没到底」，
 * 行距大时预览末尾几行甚至被切在视口外，得再单独滚一次右侧才看得到。
 *
 * 收拢区只取末端**半个视口**：中段行程保持逐行对齐不受影响，只在真正接近
 * 文档结尾、且两侧几何已经对不拢的最后一段做线性过渡。过渡终点是 to 的内容结尾
 * （最后一行底边贴住 to 视口底），保证两侧同时「看到底」。
 */
function blendToEnd(
  from: HTMLElement,
  to: HTMLElement,
  anchorTarget: number,
  fromIsEditor: boolean,
): number {
  const fromEnd = endScrollTop(from, fromIsEditor)
  if (fromEnd <= 0)
    return anchorTarget

  const zone = Math.min(from.clientHeight * 0.5, fromEnd)
  const zoneStart = fromEnd - zone
  if (from.scrollTop <= zoneStart)
    return anchorTarget

  const toEnd = endScrollTop(to, !fromIsEditor)
  const t = Math.min(1, (from.scrollTop - zoneStart) / zone)
  return anchorTarget + t * (toEnd - anchorTarget)
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
  /** resync 自己的 rAF（不占 pending 槽位，见 resync 注释） */
  let resyncRafId: number | null = null
  /**
   * 分页重建后的「待回同步」标记。重建（行高/字体/边距变化触发）会改变预览内容高度，
   * 浏览器把预览 scrollTop 钳回可滚范围并派发 scroll 事件 —— 那不是用户滚动，
   * 若照常按「预览→编辑器」同步会把编辑器拽到错位的地方。
   * 标记存续期间吞掉预览侧事件，回同步完成后清除。
   */
  let awaitingResync = false
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

  /** 把 fromRoot 的滚动位置同步给 toRoot（锚点插值 + 末端对齐，无锚点时退回比例） */
  function syncFrom(fromRoot: HTMLElement | null, toRoot: HTMLElement | null, fromIsEditor: boolean) {
    if (!fromRoot || !toRoot)
      return

    const from = findScroller(fromRoot)
    const to = findScroller(toRoot)
    if (!from || !to)
      return

    // 锚点插值负责中段；blendToEnd 把最后一个视口向文档结尾收拢，
    // 否则预览末尾的分页空白永远滚不到，左侧到底时右侧还差一截
    const target = blendToEnd(from, to, targetByAnchors(from, to, fromIsEditor), fromIsEditor)
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
    // 分页重建引起的 scrollTop 钳制不是用户滚动，等 resync 接管
    if (awaitingResync)
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
    if (resyncRafId !== null) {
      cancelAnimationFrame(resyncRafId)
      resyncRafId = null
    }
    awaitingResync = false
    pending = null
    if (!started)
      return
    started = false
    leftRef.value?.removeEventListener('scroll', onLeftScroll, listenOptions)
    rightRef.value?.removeEventListener('scroll', onRightScroll, listenOptions)
  }

  /**
   * 分页重建后主动做一次「编辑器 → 预览」回同步。
   *
   * 行高/字体/边距变化会整棵重建预览 DOM：每行的 y 全变了，但没有任何 scroll
   * 事件发生（用户没动），两栏从这一刻起错位，直到下次滚动才"自愈"。
   * 重建同时可能把预览 scrollTop 钳回可滚范围 —— 那个事件已在 onRightScroll
   * 里按 awaitingResync 吞掉，这里以编辑器为基准把预览拉回对齐位。
   *
   * 独立于 pending 槽位：用户滚动的同步任务（方向不定）不该被它覆盖，
   * 两者同帧先后执行时以这里的最终结果为准即可。
   */
  function resync() {
    // 跟随滚动关闭时没有监听，两栏本来就不互相同步
    if (!started)
      return
    awaitingResync = true
    if (resyncRafId !== null)
      cancelAnimationFrame(resyncRafId)
    // 等一帧：让重建引起的 scrollTop 钳制事件先派发完，几何稳定后再取值
    resyncRafId = requestAnimationFrame(() => {
      resyncRafId = null
      syncFrom(leftRef.value, rightRef.value, true)
      awaitingResync = false
    })
  }

  return { start, stop, resync }
}
