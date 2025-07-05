<script lang="ts" setup>
import type { ResumeData } from '~~/types/resume'
import { Label, LabelLoading } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const props = defineProps<{
  downloadImg: () => void
  downloadPdf: () => void
  data: ResumeData
}>()

const emit = defineEmits<{
  (e: 'update:data', data: ResumeData): void
}>()

const route = useRoute()
const reId = computed(() => (route.params as { id: string }).id as string)

function updateData(key: string, value: any) {
  if (key.startsWith('settings.')) {
    const settingKey = key.slice(9)
    emit('update:data', {
      ...props.data,
      settings: {
        ...props.data.settings,
        [settingKey]: value,
      } as ResumeSettings,
    })
  }
  else {
    emit('update:data', {
      ...props.data,
      [key]: value,
    })
  }
}
const { t } = useI18n()
const { toggle } = useFullscreen(document.body)
const localePath = useLocalePath()
</script>

<template>
  <div class="px-2 py-1 bg-[#606060] flex gap-4 h-10 w-full items-center left-0% top-0 fixed">
    <NuxtLink :to="localePath('resumes')" class="item">
      <div class="i-ri-arrow-left-line text-white" />
    </NuxtLink>
    <div>
      <PluginFontSelect
        :data="data.settings?.fontname"
        @update:data="(fontname) => updateData('settings.fontname', fontname)"
      />
    </div>
    <div>
      <PluginPagePaddingSelect
        :data="data.settings?.pagePadding"
        @update:data="(pagePadding) => updateData('settings.pagePadding', pagePadding)"
      />
    </div>
    <div>
      <PluginPageLineHeight
        :data="data.settings?.pageLineHeight"
        @update:data="(pageLineHeight) => updateData('settings.pageLineHeight', pageLineHeight)"
      />
    </div>
    <div class="plugin-item">
      <Switch
        id="airplane-mode" :model-value="data.settings?.isScrollable"
        @update:model-value="updateData('settings.isScrollable', $event)"
      />
      <Label for="airplane-mode" class="plugin-label">{{ t('plugin.followScroll') }}</Label>
    </div>
    <div class="plugin-item">
      <Switch
        id="editor-mode" :model-value="data.settings?.editorMode === 'source'"
        @update:model-value="updateData('settings.editorMode', $event ? 'source' : 'wysiwyg')"
      />
      <Label for="editor-mode" class="plugin-label">
        {{ data.settings?.editorMode === 'source' ? t('plugin.source')
          : t('plugin.wysiwyg')
        }}</Label>
    </div>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <NuxtLink to="https://icon-sets.iconify.design/ri/" target="_blank" class="plugin-item">
            <svg class="icon-btn" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24">
              <path
                d="M12 22c5.514 0 10-4.486 10-10S17.514 2 12 2S2 6.486 2 12s4.486 10 10 10zm3.493-13a1.494 1.494 0 1 1-.001 2.987A1.494 1.494 0 0 1 15.493 9zm-4.301 6.919a4.108 4.108 0 0 0 1.616 0c.253-.052.505-.131.75-.233c.234-.1.464-.224.679-.368c.208-.142.407-.306.591-.489c.183-.182.347-.381.489-.592l1.658 1.117a6.027 6.027 0 0 1-1.619 1.621a6.003 6.003 0 0 1-2.149.904a6.116 6.116 0 0 1-2.414-.001a5.919 5.919 0 0 1-2.148-.903a6.078 6.078 0 0 1-1.621-1.622l1.658-1.117c.143.211.307.41.488.59a3.988 3.988 0 0 0 2.022 1.093zM8.5 9a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 8.5 9z"
                fill="currentColor"
              />
            </svg>
            <Label for="icon-list" class="plugin-label">{{ t('plugin.iconList') }}</Label>
          </NuxtLink>
        </TooltipTrigger>
        <TooltipContent>
          <p class="w-50">
            {{ t('plugin.iconListTooltip') }}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <PluginPhotoIdPhoto :resume-content="data.content" @update:resume-content="updateData('content', $event)">
      <div class="plugin-item">
        <div class="i-ri-id-card-line icon-btn" />
        <Label class="plugin-label">{{ t('plugin.idPhoto') }}</Label>
      </div>
    </PluginPhotoIdPhoto>
    <PluginThemeColorAndBg
      :page-theme-color="data.settings?.pageThemeColor"
      :page-background="data.settings?.pageBackground"
      @update:page-theme-color="val => updateData('settings.pageThemeColor', val)"
      @update:page-background="val => updateData('settings.pageBackground', val)"
    >
      <div class="plugin-item">
        <svg class="icon-btn" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M19.54 5.08A10.6 10.6 0 0 0 11.91 2a10 10 0 0 0-.05 20a2.58 2.58 0 0 0 2.53-1.89a2.52 2.52 0 0 0-.57-2.28a.5.5 0 0 1 .37-.83h1.65A6.15 6.15 0 0 0 22 11.33a8.48 8.48 0 0 0-2.46-6.25m-12.7 9.66a1.5 1.5 0 1 1 .4-2.08a1.49 1.49 0 0 1-.4 2.08M8.3 9.25a1.5 1.5 0 1 1-.55-2a1.5 1.5 0 0 1 .55 2M11 7a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 11 7m5.75.8a1.5 1.5 0 1 1 .55-2a1.5 1.5 0 0 1-.55 2"
          />
        </svg>
        <Label class="plugin-label">{{ t('plugin.theme') }}</Label>
      </div>
    </PluginThemeColorAndBg>
    <PluginThemeListModal :model-value="data.theme" @update:model-value="updateData('theme', $event)">
      <div class="plugin-item cursor-pointer">
        <svg class="icon-btn" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M8 13h8v-2H8zm0 3h8v-2H8zm0 3h5v-2H8zm-4 3V2h10l6 6v14zm9-13V4H6v16h12V9zM6 4v5zv16z"
          />
        </svg>
        <Label class="plugin-label">{{ t('plugin.resumeTemplate') }}</Label>
      </div>
    </PluginThemeListModal>
    <LabelLoading :action="downloadImg">
      <div class="plugin-item">
        <div class="i-ri-image-line icon-btn" />
        <Label class="plugin-label">{{ t('plugin.screenshot') }}</Label>
      </div>
    </LabelLoading>
    <!-- <PluginReset>
      <div class="plugin-item">
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24"><path fill="currentColor" d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89l.07.14L9 12H6a7 7 0 0 1 7-7a7 7 0 0 1 7 7a7 7 0 0 1-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.9 8.9 0 0 0 13 21a9 9 0 0 0 9-9a9 9 0 0 0-9-9" /></svg>
        <Label class="plugin-label">重置</Label>
      </div>
    </PluginReset> -->
    <div class="plugin-item" @click.stop="toggle">
      <div class="i-ri-fullscreen-line icon-btn" />
      <Label class="plugin-label">{{ t('plugin.fullscreen') }}</Label>
    </div>
    <PluginExportButton :on-export="downloadPdf" />
    <PluginCorrectCase :content="data.content" @update:content="updateData('content', $event)" />
    <NuxtLink
      :to="localePath({
        name: 'preview-id',
        params: {
          id: reId,
        },
      })" class="plugin-item"
    >
      <div class="i-ri-eye-line icon-btn" />
      <Label class="plugin-label">{{ t('plugin.preview') }}</Label>
    </NuxtLink>
    <PluginSaveInfo :data="data" />
  </div>
</template>

<style>
.plugin-item {
  @apply flex items-center space-x-2;
}

.plugin-item svg {
  @apply icon-btn hover:scale-105;
}

.plugin-label {
  @apply text-white font-normal text-xs ! cursor-pointer hover:scale-105;
}
</style>
