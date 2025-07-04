<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { ChromePicker, tinycolor } from 'vue-color'
import { useI18n } from 'vue-i18n'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { pageBgList, presetColors } from '~/constants'
import 'vue-color/style.css'

const props = defineProps<{
  pageBackground?: string
  pageThemeColor?: string
}>()
const emit = defineEmits<{
  (e: 'update:pageBackground', value: string): void
  (e: 'update:pageThemeColor', value: string): void
}>()

const isColorPickerOpen = ref(false)
const { t } = useI18n()

const color = defineModel<string>({
  default: 'rgb(0,0,0)',
})

const backgroundList = computed(() => {
  return pageBgList?.map(item => ({
    ...item,
    isSelected: item.value === props.pageBackground,
  })) ?? []
})

const currentColorValue = computed(() => {
  return props.pageThemeColor === 'default' || !props.pageThemeColor
    ? 'rgb(0,0,0)'
    : `rgb(${props.pageThemeColor})`
})

function selectPresetColor(colorValue: string) {
  const rgb = tinycolor(colorValue).toRgb()
  const rgbString = `${rgb.r},${rgb.g},${rgb.b}`
  emit('update:pageThemeColor', rgbString)
  color.value = colorValue
}

function handleBackgroundSelect(backgroundValue: string) {
  emit('update:pageBackground', backgroundValue)
}

function toggleColorPicker() {
  isColorPickerOpen.value = !isColorPickerOpen.value
}

function closeColorPicker() {
  isColorPickerOpen.value = false
}

watch(color, (newColor) => {
  if (newColor && newColor !== currentColorValue.value) {
    const rgb = tinycolor(newColor).toRgb()
    emit('update:pageThemeColor', `${rgb.r},${rgb.g},${rgb.b}`)
  }
}, { immediate: false })

onMounted(() => {
  color.value = currentColorValue.value
})
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>

    <DialogContent
      overlay-class="bg-transparent"
      class="accordionContent p-2 border bg-background h-100vh w-400px shadow-lg left-255px fixed z-50 sm:rounded-l-0"
    >
      <DialogHeader class="dialogHeader">
        <DialogTitle class="text-lg font-semibold">
          {{ t('themeColorAndBg.title') }}
        </DialogTitle>
        <DialogDescription class="text-sm text-gray-600">
          {{ t('themeColorAndBg.description') }}
        </DialogDescription>
        <DialogClose
          class="rounded-sm opacity-70 cursor-pointer ring-offset-background transition-opacity right-4 top-8 absolute z-20 data-[state=open]:text-muted-foreground focus:outline-none data-[state=open]:bg-accent hover:opacity-100 disabled:pointer-events-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X class="h-4 w-4" />
          <span class="sr-only">Close</span>
        </DialogClose>
      </DialogHeader>

      <div class="p-4 space-y-6" @click.self="closeColorPicker">
        <!-- 当前颜色显示 -->
        <div class="space-y-2">
          <h3 class="text-sm text-gray-700 font-medium">
            {{ t('themeColorAndBg.currentColor') }}
          </h3>
          <div class="flex items-center space-x-3">
            <div
              class="border-2 border-gray-200 rounded-lg h-10 w-10 cursor-pointer shadow-sm transition-all hover:scale-105"
              :style="{ backgroundColor: `rgb(${pageThemeColor})` }"
              @click.stop="toggleColorPicker"
            />
            <span class="text-sm text-gray-600 font-mono">{{ pageThemeColor }}</span>
          </div>
        </div>

        <!-- 预设颜色 -->
        <div class="space-y-3">
          <h3 class="text-sm text-gray-700 font-medium">
            {{ t('themeColorAndBg.presetColors') }}
          </h3>
          <div class="gap-2 grid grid-cols-6">
            <div
              v-for="preset in presetColors"
              :key="preset.value"
              class="group cursor-pointer relative"
              @click="selectPresetColor(preset.value)"
            >
              <div
                class="border-2 border-gray-200 rounded-lg h-8 w-8 shadow-sm transition-all hover:shadow-md hover:scale-110"
                :style="{ backgroundColor: preset.value }"
              />
              <div
                class="opacity-0 translate-x-1 transform transition-opacity bottom-1 left-1/2 absolute z-10 group-hover:opacity-100"
              >
                <span class="text-xs text-gray-600 whitespace-nowrap">{{ preset.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 自定义颜色选择器 -->
        <div class="space-y-3">
          <h3 class="text-sm text-gray-700 font-medium">
            {{ t('themeColorAndBg.customColor') }}
          </h3>
          <div class="flex items-center space-x-3">
            <button
              class="text-sm px-3 py-2 border border-gray-300 rounded-md transition-colors hover:bg-gray-50"
              @click="toggleColorPicker"
            >
              {{ isColorPickerOpen ? t('themeColorAndBg.closeColorPicker') : t('themeColorAndBg.openColorPicker') }}
            </button>
          </div>
          <ChromePicker v-if="isColorPickerOpen" v-model="color" />
        </div>

        <!-- 背景图片选择 -->
        <div class="bg-selected-wrapper pt-4 border-t border-gray-200 space-y-3">
          <h3 class="text-sm text-gray-700 font-medium">
            {{ t('themeColorAndBg.backgroundImages') }}
          </h3>
          <div class="themeList">
            <div
              v-for="theme in backgroundList"
              :key="theme.value"
              class="theme-card"
              :class="{ 'theme-card-selected': theme.isSelected }"
              @click="handleBackgroundSelect(theme.value)"
            >
              <div
                class="theme-image"
                :class="{ 'h-full': theme.value === 'default' }"
              >
                <img
                  v-if="theme.value !== 'default'"
                  :src="theme.value"
                  :alt="theme.name"
                  loading="lazy"
                >
              </div>
              <div class="theme-label">
                <div
                  v-if="theme.isSelected"
                  class="theme-selected-icon i-ri-checkbox-circle-line"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style>
.dialogHeader {
  @apply sticky top-0 z-10 bg-white pb-2 p-4;
}

.accordionContent {
  display: block;
  overflow: hidden;
  will-change: transform;
  transform: translateX(0);
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.accordionContent[data-state='open'] {
  animation: slideInRight 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.accordionContent[data-state='closed'] {
  animation: slideOutLeft 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInRight {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutLeft {
  from {
    transform: translateX(0);
    opacity: 1;
  }

  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .accordionContent,
  .accordionContent[data-state='open'],
  .accordionContent[data-state='closed'] {
    animation: none;
    transition: none;
  }
}

@media (max-width: 768px) {
  .accordionContent {
    @apply right-2 left-2 w-auto max-w-none;
  }
}
</style>

<style scoped>
.themeList {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.theme-card {
  @apply rounded-lg overflow-hidden border border-gray-200 transition-all duration-200 hover:shadow-lg hover:border-primary cursor-pointer relative;
}

.theme-card-selected {
  @apply border-primary shadow-md;
}

.theme-selected-icon {
  @apply absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-2xl bg-primary/90 rounded-full p-1.5 shadow-lg bg-white;
}

.theme-image {
  @apply overflow-hidden bg-[#000];
}

.theme-image img {
  @apply w-full object-cover transition-transform duration-200 hover:scale-105;
}
</style>
