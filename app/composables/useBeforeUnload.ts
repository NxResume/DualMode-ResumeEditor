import type { ConfigurableWindow } from '@vueuse/core'
import { useEventListener } from '@vueuse/core'
import { toRef } from 'vue'

export interface UseBeforeUnloadOptions extends ConfigurableWindow {
  enabled?: boolean
  message?: string
}

export function useBeforeUnload(options: UseBeforeUnloadOptions = {}) {
  const {
    window = typeof globalThis !== 'undefined' ? globalThis.window : undefined,
    message = '确定要离开吗？',
    enabled = true,
  } = options

  const enabledRef = toRef(options, 'enabled', enabled)
  const messageRef = toRef(options, 'message', message)

  const handler = (event: BeforeUnloadEvent) => {
    if (!enabledRef.value || !messageRef.value)
      return
    event.preventDefault()
    event.returnValue = messageRef.value
    return messageRef.value
  }

  // 使用 useEventListener 自动处理监听器的绑定和解绑
  useEventListener(window, 'beforeunload', handler, {
    passive: false,
  })
}
