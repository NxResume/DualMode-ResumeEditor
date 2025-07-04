<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  content?: string
  previewRef: HTMLElement | null
  settings?: { imagePosition?: { left: number, top: number, scale: number | string } }
}>()
const emit = defineEmits<{
  (e: 'update:content', content?: string): void
  (e: 'update:imagePosition', pos: { left: number, top: number, scale: number | string }): void
}>()

const isShowMoveabled = ref(false)

function bindImageClickEvent() {
  if (!props.previewRef)
    return
  props.previewRef.addEventListener('click', handleClick)
}
function unbindImageClickEvent() {
  if (!props.previewRef)
    return
  props.previewRef.removeEventListener('click', handleClick)
}
function handleClick(event: Event) {
  const target = event.target as HTMLElement
  if (target.tagName.toLowerCase() === 'img' && target.hasAttribute('data-id-photo')) {
    isShowMoveabled.value = true
  }
  else {
    isShowMoveabled.value = false
  }
}
function handleKeyDown(event: KeyboardEvent) {
  if (isShowMoveabled.value && event.key === 'Backspace') {
    const imgTagRegex = /<img[^>]*id\s*=\s*['"]id-photo['"][^>]*>/gi
    emit('update:content', props.content?.replace(imgTagRegex, ''))
    isShowMoveabled.value = false
  }
}
function handleImagePositionUpdate(pos: { left: number, top: number, scale: number | string }) {
  emit('update:imagePosition', pos)
}

onMounted(() => {
  bindImageClickEvent()
  document.addEventListener('keydown', handleKeyDown)
})
onUnmounted(() => {
  unbindImageClickEvent()
  document.removeEventListener('keydown', handleKeyDown)
})
watch(() => props.previewRef, (newVal, oldVal) => {
  if (oldVal)
    oldVal.removeEventListener('click', handleClick)
  if (newVal)
    newVal.addEventListener('click', handleClick)
})
</script>

<template>
  <PluginPhotoImageMoveable
    v-if="isShowMoveabled"
    :image-position="props.settings?.imagePosition"
    @update:image-position="handleImagePositionUpdate"
  />
</template>
