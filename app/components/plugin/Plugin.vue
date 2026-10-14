<script lang="ts" setup>
import type { ResumeData } from '~~/types/resume'
import { isClient } from '@vueuse/core'
import { LabelLoading } from '@/components/ui/label'

const props = defineProps<{
  downloadImg: () => void
  downloadPdf: () => void
  data: ResumeData
  editorCollapsed?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:data', data: ResumeData): void
  (e: 'toggleSettings'): void
  (e: 'toggleEditor'): void
}>()

// 顶栏与设置面板共用同一套字段更新逻辑
const updateData = useResumeFieldUpdate(() => props.data, data => emit('update:data', data))

const { t } = useI18n()
const { toggle } = useFullscreen(isClient ? document.body : null)
const localePath = useLocalePath()
const route = useRoute()
const reId = computed(() => (route.params as { id: string }).id as string)
const isSource = computed(() => props.data.settings?.editorMode === 'source')

const settingsOpen = defineModel<boolean>('settingsOpen', { default: false })

function setMode(mode: 'source' | 'wysiwyg') {
  if (props.data.settings?.editorMode === mode)
    return
  updateData('settings.editorMode', mode)
}
</script>

<template>
  <header class="topbar">
    <!-- 左：返回 / 简历名 / 保存状态 -->
    <div class="tb-left">
      <NuxtLink :to="localePath('resumes')" class="tb-icon-btn" :title="t('back')">
        <span class="i-ri-arrow-left-line" />
      </NuxtLink>
      <span class="tb-name" :title="data.name || t('editor.title')">
        {{ data.name || t('editor.title') }}
      </span>
      <PluginSaveInfo :data="data" />
    </div>

    <!-- 中：编辑模式 -->
    <div class="tb-center">
      <div class="tb-seg" role="tablist">
        <button
          class="tb-seg-btn" :class="{ 'is-on': isSource }" type="button"
          @click="setMode('source')"
        >
          {{ t('plugin.source') }}
        </button>
        <button
          class="tb-seg-btn" :class="{ 'is-on': !isSource }" type="button"
          @click="setMode('wysiwyg')"
        >
          {{ t('plugin.wysiwyg') }}
        </button>
      </div>
    </div>

    <!-- 右：动作 -->
    <div class="tb-right">
      <button
        class="shell-btn" :class="{ 'is-on': !editorCollapsed }" type="button"
        :title="editorCollapsed ? t('plugin.expandEditor') : t('plugin.collapseEditor')"
        @click="emit('toggleEditor')"
      >
        <span class="i-ri-layout-left-line" />
        <span class="tb-hide-sm">{{ t('plugin.editor') }}</span>
      </button>

      <LabelLoading :action="downloadImg">
        <span class="shell-btn">
          <span class="i-ri-image-line" />
          <span class="tb-hide-sm">{{ t('plugin.screenshot') }}</span>
        </span>
        <template #loading>
          <span class="shell-btn">
            <span class="i-ri-image-line" />
            <span class="tb-hide-sm">{{ t('export.exporting') }}</span>
          </span>
        </template>
      </LabelLoading>

      <PluginExportButton :on-export="downloadPdf" />

      <NuxtLink
        :to="localePath({ name: 'preview-id', params: { id: reId } })"
        class="shell-btn"
      >
        <span class="i-ri-eye-line" />
        <span class="tb-hide-sm">{{ t('plugin.preview') }}</span>
      </NuxtLink>

      <button class="shell-btn" type="button" @click="toggle">
        <span class="i-ri-fullscreen-line" />
        <span class="tb-hide-sm">{{ t('plugin.fullscreen') }}</span>
      </button>

      <button
        class="is-settings shell-btn" :class="{ 'is-on': settingsOpen }" type="button"
        @click="emit('toggleSettings')"
      >
        <span class="i-ri-settings-3-line" />
        <span class="tb-hide-sm">{{ t('plugin.settings') }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
/* 顶栏高度写进 CSS 变量：主题色面板等浮层要用它算纵向起始位置 */
.topbar {
  --topbar-h: 56px;
  height: var(--topbar-h);
  flex: none;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  background: hsl(var(--background));
  border-bottom: 1px solid hsl(var(--border));
  box-shadow: 0 1px 3px rgb(15 23 42 / 5%);
  position: relative;
  z-index: 20;
}

.tb-left,
.tb-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.tb-right {
  justify-content: flex-end;
  gap: 4px;
}

.tb-center {
  justify-self: center;
}

.tb-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 8px;
  color: hsl(var(--foreground) / 0.75);
  cursor: pointer;
  transition:
    background-color 150ms,
    color 150ms;
}

.tb-icon-btn:hover {
  background: hsl(var(--accent));
  color: hsl(var(--foreground));
}

.tb-name {
  max-width: 200px;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--foreground));
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tb-seg {
  display: inline-flex;
  padding: 3px;
  background: hsl(var(--muted));
  border-radius: 8px;
}

.tb-seg-btn {
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 12.5px;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 150ms,
    color 150ms;
}

.tb-seg-btn.is-on {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  box-shadow: 0 1px 3px rgb(15 23 42 / 8%);
}

.shell-btn.is-on {
  background: hsl(var(--accent));
  color: hsl(var(--foreground));
}

/* 窄窗口下右侧动作只留图标，避免顶栏溢出 */
@media (max-width: 1180px) {
  .tb-hide-sm {
    display: none;
  }
}
</style>
