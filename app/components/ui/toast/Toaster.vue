<script setup lang="ts">
import { isVNode } from 'vue'
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '.'
import { useToast } from './use-toast'

const { toasts } = useToast()

// 单行消息用胶囊，带描述的用圆角卡片（胶囊包两行会很难看）
const ICONS: Record<string, string> = {
  default: 'i-ri-information-line',
  success: 'i-ri-checkbox-circle-fill',
  destructive: 'i-ri-close-circle-fill',
  info: 'i-ri-information-fill',
  warning: 'i-ri-error-warning-fill',
}
</script>

<template>
  <ToastProvider>
    <Toast
      v-for="toast in toasts" :key="toast.id" v-bind="toast"
      :class="toast.description ? 'rounded-xl' : 'rounded-full'"
    >
      <span class="toast-icon" :class="[`is-${toast.variant || 'default'}`, ICONS[toast.variant || 'default']]" />
      <div class="flex-1 gap-0.5 grid min-w-0">
        <ToastTitle v-if="toast.title">
          {{ toast.title }}
        </ToastTitle>
        <template v-if="toast.description">
          <ToastDescription v-if="isVNode(toast.description)">
            <component :is="toast.description" />
          </ToastDescription>
          <ToastDescription v-else>
            {{ toast.description }}
          </ToastDescription>
        </template>
        <ToastClose />
      </div>
      <component :is="toast.action" />
    </Toast>
    <ToastViewport />
  </ToastProvider>
</template>

<style scoped>
/* 状态不只靠颜色：图标 + 文案双通道。图标是唯一的彩色元素（胶囊本身无彩色边框） */
.toast-icon {
  flex: none;
  font-size: 15px;
  color: hsl(var(--muted-foreground));
}

.toast-icon.is-success {
  color: #22c55e;
}

.toast-icon.is-destructive {
  color: hsl(var(--destructive));
}

.toast-icon.is-info {
  color: #3b82f6;
}

.toast-icon.is-warning {
  color: #f59e42;
}
</style>
