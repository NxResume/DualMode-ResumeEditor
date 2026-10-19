<script lang="ts" setup>
import type { ResumeData } from '~~/types/resume'
import { Switch } from '@/components/ui/switch'

const props = defineProps<{
  data: ResumeData
  autoSave?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:data', data: ResumeData): void
  (e: 'update:autoSave', value: boolean): void
  (e: 'close'): void
}>()

// 与顶栏共用同一套字段更新逻辑（只改内存，落盘仍由保存按钮负责）
const updateData = useResumeFieldUpdate(() => props.data, data => emit('update:data', data))
const { t } = useI18n()

// 证件照压缩开关：编辑器偏好，与 IdPhoto 弹窗共用同一个 localStorage key
const idPhotoCompress = useIdPhotoCompressEnabled()
</script>

<template>
  <aside class="settings-panel">
    <header class="panel-head">
      <span class="panel-title">{{ t('plugin.settings') }}</span>
      <button class="panel-close" type="button" :title="t('plugin.closePanel')" @click="emit('close')">
        <span class="i-ri-close-line" />
      </button>
    </header>

    <div class="panel-body">
      <section class="panel-section">
        <h4 class="section-title">
          {{ t('plugin.groupTypography') }}
        </h4>
        <div class="field">
          <span class="field-label">{{ t('plugin.font') }}</span>
          <PluginFontSelect
            :data="data.settings?.fontname"
            @update:data="(val: any) => updateData('settings.fontname', val)"
          />
        </div>
        <div class="field">
          <span class="field-label">{{ t('plugin.pagePadding') }}</span>
          <PluginPagePaddingSelect
            :data="data.settings?.pagePadding"
            @update:data="(val: any) => updateData('settings.pagePadding', val)"
          />
        </div>
        <div class="field">
          <span class="field-label">{{ t('plugin.lineHeight') }}</span>
          <PluginPageLineHeight
            :data="data.settings?.pageLineHeight"
            @update:data="(val: any) => updateData('settings.pageLineHeight', val)"
          />
        </div>
        <div class="field">
          <span class="field-label">{{ t('plugin.followScroll') }}</span>
          <Switch
            id="settings-follow-scroll" :model-value="data.settings?.isScrollable"
            @update:model-value="(val: any) => updateData('settings.isScrollable', val)"
          />
        </div>
      </section>

      <section class="panel-section">
        <h4 class="section-title">
          {{ t('plugin.groupAppearance') }}
        </h4>

        <PluginThemeColorAndBg
          :page-theme-color="data.settings?.pageThemeColor"
          :page-background="data.settings?.pageBackground"
          :resume-theme="data.theme"
          @update:page-theme-color="(val: string) => updateData('settings.pageThemeColor', val)"
          @update:page-background="(val: string) => updateData('settings.pageBackground', val)"
        >
          <button class="panel-row" type="button">
            <span class="panel-row-icon i-ri-palette-line" />
            <span class="panel-row-text">{{ t('plugin.theme') }}</span>
            <span class="panel-row-arrow i-ri-arrow-right-s-line" />
          </button>
        </PluginThemeColorAndBg>

        <PluginThemeListModal
          :model-value="data.theme"
          @update:model-value="(val: string) => updateData('theme', val)"
        >
          <button class="panel-row" type="button">
            <span class="panel-row-icon i-ri-file-list-3-line" />
            <span class="panel-row-text">{{ t('plugin.resumeTemplate') }}</span>
            <span class="panel-row-arrow i-ri-arrow-right-s-line" />
          </button>
        </PluginThemeListModal>
      </section>

      <section class="panel-section">
        <h4 class="section-title">
          {{ t('plugin.groupSave') }}
        </h4>
        <div class="field">
          <span class="field-label">{{ t('plugin.autoSave') }}</span>
          <Switch
            id="settings-auto-save" :model-value="!!props.autoSave"
            @update:model-value="(val: any) => emit('update:autoSave', !!val)"
          />
        </div>
        <p class="field-hint">
          {{ t('plugin.autoSaveHint') }}
        </p>
      </section>

      <section class="panel-section">
        <h4 class="section-title">
          {{ t('plugin.groupContent') }}
        </h4>

        <PluginPhotoIdPhoto
          :resume-content="data.content"
          @update:resume-content="(val: string) => updateData('content', val)"
        >
          <button class="panel-row" type="button">
            <span class="panel-row-icon i-ri-id-card-line" />
            <span class="panel-row-text">{{ t('plugin.idPhoto') }}</span>
            <span class="panel-row-arrow i-ri-arrow-right-s-line" />
          </button>
        </PluginPhotoIdPhoto>

        <div class="field">
          <span class="field-label">{{ t('plugin.idPhotoCompress') }}</span>
          <Switch id="settings-idphoto-compress" v-model="idPhotoCompress" />
        </div>
        <p class="field-hint">
          {{ t('plugin.idPhotoCompressHint') }}
        </p>

        <!-- 自带 plugin-item 行样式，直接复用 -->
        <PluginCorrectCase
          :content="data.content"
          @update:content="(val: string) => updateData('content', val)"
        />

        <a
          class="panel-row"
          href="https://icon-sets.iconify.design/ri/"
          target="_blank"
          rel="noopener"
        >
          <span class="panel-row-icon i-ri-emotion-line" />
          <span class="panel-row-text">{{ t('plugin.iconList') }}</span>
          <span class="panel-row-arrow i-ri-external-link-line" />
        </a>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.settings-panel {
  width: 268px;
  flex: none;
  display: flex;
  flex-direction: column;
  background: hsl(var(--background));
  border-left: 1px solid hsl(var(--border));
}

.panel-head {
  height: 44px;
  flex: none;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid hsl(var(--border));
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.panel-close {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  transition: background-color 150ms;
}

.panel-close:hover {
  background: hsl(var(--accent));
  color: hsl(var(--foreground));
}

.panel-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 0 24px;
}

.panel-section {
  padding: 12px 12px 4px;
}

.panel-section + .panel-section {
  border-top: 1px solid hsl(var(--border));
  margin-top: 8px;
}

.section-title {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.3px;
  color: hsl(var(--muted-foreground));
  margin-bottom: 6px;
}

.field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 34px;
  padding: 2px 0;
}

.field-label {
  font-size: 13px;
  color: hsl(var(--foreground) / 0.8);
  white-space: nowrap;
}

.field-hint {
  margin: -2px 0 4px;
  font-size: 11.5px;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
}

.panel-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 13px;
  color: hsl(var(--foreground) / 0.8);
  cursor: pointer;
  text-align: left;
  transition:
    background-color 150ms,
    color 150ms;
}

.panel-row:hover {
  background: hsl(var(--accent));
  color: hsl(var(--foreground));
}

.panel-row-icon {
  font-size: 15px;
  opacity: 0.8;
}

.panel-row-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-row-arrow {
  color: hsl(var(--muted-foreground));
  font-size: 14px;
}

/* 不够宽时：设置面板改成浮层（浮在预览上），避免和编辑器一起把预览挤到看不清 */
@media (max-width: 1439px) {
  .settings-panel {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    box-shadow: -8px 0 24px rgb(15 23 42 / 10%);
  }
}
</style>
