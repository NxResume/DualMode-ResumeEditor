export function useAutoScrollBounce(
  containerRef: Ref<HTMLElement | null>,
  options?: { step?: number, intervalTime?: number },
) {
  const step = options?.step ?? 1
  const intervalTime = options?.intervalTime ?? 20
  const tolerance = 1
  let intervalId: number | null = null

  onMounted(() => {
    const el = containerRef.value
    if (!el)
      return

    let direction: 'right' | 'left' = 'right'

    intervalId = window.setInterval(() => {
      if (direction === 'right') {
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - tolerance) {
          direction = 'left'
        }
        else {
          el.scrollLeft += step
        }
      }
      else {
        if (el.scrollLeft <= tolerance) {
          direction = 'right'
        }
        else {
          el.scrollLeft -= step
        }
      }
    }, intervalTime)
  })

  onUnmounted(() => {
    if (intervalId !== null) {
      clearInterval(intervalId)
    }
  })
}
