<script setup lang="ts">
import type { ToastViewportProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ToastViewport } from 'reka-ui'
import { cn } from '@/utils/ui'

const props = defineProps<ToastViewportProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <ToastViewport v-bind="delegatedProps" :class="cn('fixed left-1/2 top-0 z-100 flex max-h-screen w-[calc(100%-2rem)] max-w-90 -translate-x-1/2 flex-col items-center gap-2 p-4', props.class)" />
</template>
