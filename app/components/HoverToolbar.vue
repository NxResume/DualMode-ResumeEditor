<script setup lang="ts">
import type { WysiwygTagsType } from '~/constants'

defineProps<{
  visible: boolean
  currentType: string
  types: WysiwygTagsType[]
  style: Record<string, string>
}>()
const emit = defineEmits(['format', 'active'])
const isActive = ref(false)
function handleClick(type: string) {
  emit('format', type)
}
function onFocus() {
  isActive.value = true
  emit('active', true)
}
function onBlur() {
  isActive.value = false
  emit('active', false)
}
function onMouseEnter() {
  isActive.value = true
  emit('active', true)
}
function onMouseLeave() {
  isActive.value = false
  emit('active', false)
}
</script>

<template>
  <div
    v-if="visible || isActive"
    class="text-12px px-2 py-3 border-1px border-[#eee] rounded-[4px] border-solid bg-[#fff] flex flex-col gap-4px pointer-events-auto shadow-[0_2px_8px_rgba(0,0,0,0.08)] fixed z-1000"
    :style="style"
    tabindex="0"
    @focus="onFocus"
    @blur="onBlur"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <template v-for="type in types" :key="type">
      <button
        class="toolbar-btn transition-background text-[#0070f3] font-bold px-6px py-2px rounded-[3px] border-none bg-transparent cursor-pointer transition-duration-0.15s [&:hover]-bg-[#bae7ff]"
        :class="{ active: type === currentType }"
        @mousedown.prevent="handleClick(type)"
      >
        {{ type.toUpperCase() }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.toolbar-btn.active {
  background: #e6f7ff;
  color: #222;
}
</style>
