<script setup lang="ts">
import Moveable from 'vue3-moveable'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  imagePosition?: {
    left: number
    top: number
    scale: number | string
  }
}>()
const emit = defineEmits<{
  (e: 'update:imagePosition', pos: { left: number, top: number, scale: number | string }): void
}>()

const { t } = useI18n()

interface DragEvent {
  transform: string
  left: number
  top: number
  right: number
  bottom: number
}

function onDrag({ left, top }: DragEvent) {
  if (!props.imagePosition)
    return

  emit('update:imagePosition', {
    ...props.imagePosition,
    left,
    top,
  })
}

function onScale(event: any) {
  if (!props.imagePosition)
    return

  const scaleMatch = event.transform.match(/scale\(([^)]+)\)/)
  const scale = scaleMatch ? scaleMatch[1] : '1'
  emit('update:imagePosition', {
    ...props.imagePosition,
    scale,
  })
}
</script>

<template>
  <Moveable
    class-name="moveable"
    :target="['.preview-content #id-photo']"
    :draggable="true"
    :scalable="true"
    :keep-ratio="true"
    :title="t('imageMoveable.dragTooltip')"
    @drag="onDrag"
    @scale="onScale"
  />
</template>
