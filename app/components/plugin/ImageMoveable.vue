<script setup lang="ts">
import Moveable from 'vue3-moveable'
import { useI18n } from 'vue-i18n'
import { useResumeSettingsStore } from '~/stores/resumeSettings'

const resumeSettingsStore = useResumeSettingsStore()

const { t } = useI18n()

interface DragEvent {
  transform: string
  left: number
  top: number
  right: number
  bottom: number
}

function onDrag({ left, top }: DragEvent) {
  resumeSettingsStore.updateImagePosition({
    left,
    top,
  })
}

function onScale(event: any) {
  const scaleMatch = event.transform.match(/scale\(([^)]+)\)/)
  const scale = scaleMatch ? scaleMatch[1] : '1'
  resumeSettingsStore.updateImagePosition({
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
