export function useScrollSync(leftRef: Ref<any>, rightRef: Ref<any>) {
  let isSyncing = false

  const onLeftScroll = () => {
    if (!leftRef.value || !rightRef.value)
      return
    if (isSyncing)
      return

    const left = leftRef.value
    const right = rightRef.value

    const leftMax = left.scrollHeight - left.clientHeight
    const rightMax = right.scrollHeight - right.clientHeight

    const ratio = leftMax > 0 ? left.scrollTop / leftMax : 0

    isSyncing = true
    right.scrollTop = ratio * rightMax
    isSyncing = false
  }

  const onRightScroll = () => {
    if (!leftRef.value || !rightRef.value)
      return
    if (isSyncing)
      return

    const left = leftRef.value
    const right = rightRef.value

    const leftMax = left.scrollHeight - left.clientHeight
    const rightMax = right.scrollHeight - right.clientHeight

    const ratio = rightMax > 0 ? right.scrollTop / rightMax : 0

    isSyncing = true
    left.scrollTop = ratio * leftMax
    isSyncing = false
  }

  const start = () => {
    leftRef.value?.addEventListener('scroll', onLeftScroll)
    rightRef.value?.addEventListener('scroll', onRightScroll)
  }
  const stop = () => {
    leftRef.value?.removeEventListener('scroll', onLeftScroll)
    rightRef.value?.removeEventListener('scroll', onRightScroll)
  }

  return { start, stop }
}
