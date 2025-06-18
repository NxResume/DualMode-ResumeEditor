<script setup lang="ts">
import type { ThemeName } from '~/utils'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { reTheme } from '~/utils'

const resumeStore = useResumeStore()
const { t } = useI18n()

const themeList = computed(() => {
  return reTheme.getThemeList().map((theme) => {
    return {
      value: theme,
      label: theme,
      image: `/assets/themes/${theme}.png`,
      isSelected: theme === resumeStore.theme,
    }
  })
})

function handleThemeSelect(theme: ThemeName) {
  resumeStore.theme = theme
}
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>
    <DialogContent class="dialogContent">
      <DialogHeader class="dialogHeader">
        <DialogClose as-child>
          <Button variant="ghost" class="cursor-pointer right-4 top-4 absolute z-11">
            <div class="i-ri-close-fill" />
          </Button>
        </DialogClose>
        <DialogTitle>{{ t('themeList.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('themeList.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="themeList">
        <div
          v-for="theme in themeList"
          :key="theme.value"
          class="theme-card"
          :class="{ 'theme-card-selected': theme.isSelected }"
          @click="handleThemeSelect(theme.value)"
        >
          <div class="theme-image">
            <img :src="theme.image" :alt="theme.label" srcset="">
          </div>
          <div class="theme-label">
            <!-- {{ theme.label }} -->
            <div v-if="theme.isSelected" class="theme-selected-icon i-ri-checkbox-circle-line" />
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style>
.themeList {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4 mx-6;
}

.theme-card {
  @apply rounded-lg overflow-hidden border border-gray-200 transition-all duration-200 hover:shadow-lg hover:border-primary cursor-pointer relative;
}

.theme-card-selected {
  @apply border-primary shadow-md;
}

.theme-selected-icon {
  @apply absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-2xl bg-primary/90 rounded-full p-1.5 shadow-lg backdrop-blur-sm;
}

.theme-image {
  @apply overflow-hidden;
}

.theme-image img {
  @apply w-full object-cover transition-transform duration-200 hover:scale-105;
}

/* .theme-label {
  @apply p-3 text-center font-medium text-gray-700 flex items-center justify-center gap-2;
} */

.dialogContent {
  @apply overflow-auto max-h-[80vh] max-w-[80%] pt-0 px-0;
}

.dialogHeader {
  @apply sticky top-0 z-10 bg-white p-6 pb-2;
}
</style>
