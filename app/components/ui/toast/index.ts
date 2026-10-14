import type { VariantProps } from 'class-variance-authority'
import type { ToastRootProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'

export { default as Toast } from './Toast.vue'
export { default as ToastAction } from './ToastAction.vue'
export { default as ToastClose } from './ToastClose.vue'
export { default as ToastDescription } from './ToastDescription.vue'
export { default as Toaster } from './Toaster.vue'
export { default as ToastProvider } from './ToastProvider.vue'
export { default as ToastTitle } from './ToastTitle.vue'
export { default as ToastViewport } from './ToastViewport.vue'
export { toast, useToast } from './use-toast'

export const toastVariants = cva(
  // 顶部居中的小胶囊：单行消息用 rounded-full，带描述时由 Toaster 换成 rounded-xl；
  // 边框一律中性（状态靠左侧图标 + 文案表达，不靠边框色）；
  // 入场从上方滑入 + 淡入，出场反向；尊重 prefers-reduced-motion。
  'group pointer-events-auto relative flex max-w-full items-center gap-2 overflow-hidden rounded-full border border-transparent bg-background py-2.5 pl-4 pr-9 text-foreground shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--reka-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--reka-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-top-full data-[state=open]:slide-in-from-top-full motion-reduce:animate-none motion-reduce:duration-0',
  {
    variants: {
      variant: {
        default: '',
        destructive: 'destructive group',
        success: '',
        info: '',
        warning: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type ToastVariants = VariantProps<typeof toastVariants>

export interface ToastProps extends ToastRootProps {
  class?: HTMLAttributes['class']
  variant?: ToastVariants['variant']
  onOpenChange?: ((value: boolean) => void) | undefined
}
