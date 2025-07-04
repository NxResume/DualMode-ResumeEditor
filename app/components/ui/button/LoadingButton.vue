<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '.'
import { cn } from '@/utils/ui'
import Button from './Button.vue'

const props = defineProps<{
  loading?: boolean
  disabled?: boolean
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Button
    :variant="props.variant"
    :size="props.size"
    :disabled="props.disabled || props.loading"
    :class="cn(props.class, { 'opacity-70 pointer-events-none': props.loading })"
  >
    <template v-if="props.loading">
      <svg class="mr-2 h-4 w-4 inline-block animate-spin" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <slot name="loading">
        Loading...
      </slot>
    </template>
    <template v-else>
      <slot />
    </template>
  </Button>
</template>
