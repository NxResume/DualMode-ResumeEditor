// stores/imagePosition.ts
import { useStorage } from '@vueuse/core'
import { defineStore, skipHydrate } from 'pinia'

interface ImagePositionState {
  top: number
  left: number
  scale: number | string
}

export const useImagePositionStore = defineStore('imagePosition', () => {
  // 使用 useStorage 持久化存储整个对象
  const position = useStorage<ImagePositionState>('nuxt-resume-editor-id-photo-position', {
    top: 66,
    left: 391,
    scale: '0.8 0.8',
  })

  // 更新位置
  function updatePosition(newTop?: number, newLeft?: number) {
    if (newTop !== undefined) {
      position.value.top = newTop
    }
    if (newLeft !== undefined) {
      position.value.left = newLeft
    }
  }

  // 更新缩放
  function updateScale(newScale?: number) {
    if (newScale !== undefined) {
      position.value.scale = newScale
    }
  }

  // 重置位置和缩放
  function resetPosition() {
    position.value.top = 120
    position.value.left = 600
    position.value.scale = 1
  }

  return {
    position: skipHydrate(position),
    updatePosition,
    updateScale,
    resetPosition,
  }
})
