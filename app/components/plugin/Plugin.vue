<script lang="ts" setup>
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import useSettingsStore from '~/stores/settings'

defineProps<{
  downloadImg: () => void
}>()

const settingstore = useSettingsStore()
const { t } = useI18n()
const { toggle } = useFullscreen(document.body)
</script>

<template>
  <div class="py-1 bg-[#606060] flex gap-4 h-10 w-900px items-center left-38.8% top-0 fixed">
    <div>
      <PluginFontSelect />
    </div>
    <div class="item">
      <Switch
        id="airplane-mode" :model-value="settingstore.isScrollable"
        @update:model-value="settingstore.isScrollable = $event"
      />
      <Label for="airplane-mode" class="label">{{ t('plugin.followScroll') }}</Label>
    </div>
    <div class="item">
      <Switch
        id="editor-mode" :model-value="settingstore.editorMode === 'source'"
        @update:model-value="settingstore.editorMode = $event ? 'source' : 'wysiwyg'"
      />
      <Label for="editor-mode" class="label">
        {{ settingstore.editorMode === 'source' ? t('plugin.source')
          : t('plugin.wysiwyg')
        }}</Label>
    </div>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <NuxtLink to="https://icon-sets.iconify.design/ri/" target="_blank" class="item">
            <div class="i-ri-bear-smile-line" />
            <Label for="icon-list" class="label">{{ t('plugin.iconList') }}</Label>
          </NuxtLink>
        </TooltipTrigger>
        <TooltipContent>
          <p class="w-50">
            {{ t('plugin.iconListTooltip') }}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
    <PluginThemeListModal>
      <div class="item cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="none" /><path fill="currentColor" fill-opacity="0.15" d="M512 318c-79.2 0-148.5-48.8-176.7-120H182v196h119v432h422V394h119V198H688.7c-28.2 71.2-97.5 120-176.7 120" /><path fill="currentColor" d="M870 126H663.8c-17.4 0-32.9 11.9-37 29.3C614.3 208.1 567 246 512 246s-102.3-37.9-114.8-90.7a37.93 37.93 0 0 0-37-29.3H154a44 44 0 0 0-44 44v252a44 44 0 0 0 44 44h75v388a44 44 0 0 0 44 44h478a44 44 0 0 0 44-44V466h75a44 44 0 0 0 44-44V170a44 44 0 0 0-44-44m-28 268H723v432H301V394H182V198h153.3c28.2 71.2 97.5 120 176.7 120s148.5-48.8 176.7-120H842z" /></svg>
        <Label class="label">{{ t('plugin.theme') }}</Label>
      </div>
    </PluginThemeListModal>
    <PluginIdPhoto>
      <div class="item">
        <div class="i-ri-id-card-line icon-btn" />
        <Label class="label">{{ t('plugin.idPhoto') }}</Label>
      </div>
    </PluginIdPhoto>
    <div class="item" @click.stop="downloadImg">
      <div class="i-ri-image-line icon-btn" />
      <Label class="label">{{ t('plugin.screenshot') }}</Label>
    </div>
    <div class="item" @click.stop="toggle">
      <div class="i-ri-fullscreen-line icon-btn" />
      <Label class="label">{{ t('plugin.fullscreen') }}</Label>
    </div>
  </div>
</template>

<style scoped>
.item {
  @apply flex items-center space-x-2;
}

.label {
  @apply text-white font-normal text-xs! cursor-pointer;
}
</style>
