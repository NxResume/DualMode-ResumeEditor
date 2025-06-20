<script setup lang="ts">
import Moveable from 'vue3-moveable'

interface DragEvent {
  transform: string
  left: number
  top: number
  right: number
  bottom: number
}

function onDrag({ left, top }: DragEvent) {
  const target = document.querySelector('#id-photo') as HTMLElement
  if (target) {
    target.style.left = `${left}px`
    target.style.top = `${top}px`
  }
}

function onScale(event: any) {
  const target = document.querySelector('#id-photo') as HTMLElement
  if (target && event.transform) {
    target.style.transform = event.transform
  }
}
</script>

<template>
  <Moveable
    class-name="moveable"
    :target="['#id-photo']"
    :draggable="true"
    :scalable="true"
    :keep-ratio="true"
    @drag="onDrag"
    @scale="onScale"
  />
</template>
