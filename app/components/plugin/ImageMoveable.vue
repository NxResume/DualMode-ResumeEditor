<script setup lang="ts">
import Moveable from 'vue3-moveable'
import { useI18n } from 'vue-i18n'

const imagePositionStore = useImagePositionStore()

const { t } = useI18n()

interface DragEvent {
  transform: string
  left: number
  top: number
  right: number
  bottom: number
}

function onDrag({ left, top }: DragEvent) {
  const target = document.querySelector('.preview-content #id-photo') as HTMLElement
  if (target) {
    target.style.setProperty('--id-photo-top', `${top}px`)
    target.style.setProperty('--id-photo-left', `${left}px`)
    imagePositionStore.updatePosition(top, left)
  }
}

function onScale(event: any) {
  const target = document.querySelector('.preview-content #id-photo') as HTMLElement
  if (target && event.transform) {
    // 提取 scale 数值
    const scaleMatch = event.transform.match(/scale\(([^)]+)\)/)
    const scale = scaleMatch ? scaleMatch[1] : '1'
    target.style.setProperty('--id-photo-scale', scale)
    imagePositionStore.updateScale(scale)
  }
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
