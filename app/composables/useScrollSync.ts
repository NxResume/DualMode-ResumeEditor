// 调用方可能传模板 ref，也可能传组件实例 ref；这里只读取 .value，用宽松类型避免无意义的泛型约束
type MaybeElRef = Ref<any>

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
  return el.scrollHeight - el.clientHeight
}

export function useScrollSync(leftRef: MaybeElRef, rightRef: MaybeElRef) {
  let isSyncing = false
  let started = false

  /** 按比例把 fromRoot 的滚动位置同步给 toRoot */
  function syncFrom(fromRoot: HTMLElement | null, toRoot: HTMLElement | null) {
    if (isSyncing || !fromRoot || !toRoot)
      return

    const from = findScroller(fromRoot)
    const to = findScroller(toRoot)
    if (!from || !to)
      return

    const fromMax = scrollRange(from)
    const ratio = fromMax > 0 ? from.scrollTop / fromMax : 0

    isSyncing = true
    to.scrollTop = ratio * scrollRange(to)
    isSyncing = false
  }

  // scroll 事件不冒泡，但会在**捕获阶段**经过祖先元素：挂在列容器上用捕获，
  // 既能收到内部 .cm-scroller 的滚动，也不会因为内部编辑器 DOM 被重建（切换 source / wysiwyg）而丢监听。
  // 只响应「真正在滚的那个元素」发出的事件，避免内容里的横向滚动（表格/代码块）误触发。
  const onLeftScroll = (e: Event) => {
    const root = leftRef.value
    if (!root || e.target !== findScroller(root))
      return
    syncFrom(root, rightRef.value)
  }

  const onRightScroll = (e: Event) => {
    const root = rightRef.value
    if (!root || e.target !== findScroller(root))
      return
    syncFrom(root, leftRef.value)
  }

  const listenOptions: AddEventListenerOptions = { capture: true }

  function start() {
    // 幂等：isScrollable 反复切换时不会挂上重复监听
    if (started)
      return
    started = true
    leftRef.value?.addEventListener('scroll', onLeftScroll, listenOptions)
    rightRef.value?.addEventListener('scroll', onRightScroll, listenOptions)
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
