<script lang="ts" setup>
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import useSettingsStore from '~/stores/settings'

defineProps<{
  downloadImg: () => void
}>()

const settingstore = useSettingsStore()
const { t } = useI18n()
const { toggle } = useFullscreen(document.body)
</script>

<template>
  <div class="py-1 bg-[#606060] flex gap-4 h-10 w-900px items-center left-39% top-0 fixed">
    <div>
      <FontSelect />
    </div>
    <div class="item">
      <Switch id="airplane-mode" :model-value="settingstore.isScrollable" @update:model-value="settingstore.isScrollable = $event" />
      <Label for="airplane-mode" class="label">{{ t('plugin.followScroll') }}</Label>
    </div>
    <div class="item">
      <div class="i-ri-fullscreen-line icon-btn" @click.stop="toggle" />
      <Label class="label">{{ t('plugin.fullscreen') }}</Label>
    </div>
    <div class="item">
      <div class="i-ri-image-line icon-btn" @click.stop="downloadImg" />
      <Label class="label">{{ t('plugin.screenshot') }}</Label>
    </div>
  </div>
</template>

<style scoped>
.item {
  @apply flex items-center space-x-2;
}

.label {
  @apply text-white font-normal text-xs!;
}
</style>
