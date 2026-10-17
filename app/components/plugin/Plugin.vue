<script lang="ts" setup>
import type { ResumeData } from '~~/types/resume'
import { isClient } from '@vueuse/core'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const props = defineProps<{
  downloadImg: () => unknown
  downloadPdf: () => unknown
  downloadPrintPdf: () => unknown
  data: ResumeData
  editorCollapsed?: boolean
  autoSave?: boolean
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

// 导出（PDF / 截图）合并成一个下拉，避免右侧堆两个并列动作
const isExporting = ref(false)

async function runExport(action: () => unknown) {
  if (isExporting.value)
    return
  isExporting.value = true
  try {
    await action()
  }
  finally {
    isExporting.value = false
  }
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

    <!-- 右：动作（只保留「导出 / 页面设置」两处文字，其余纯图标 + tooltip） -->
    <div class="tb-right">
      <button
        class="is-icon shell-btn" :class="{ 'is-on': !editorCollapsed }" type="button"
        :title="editorCollapsed ? t('plugin.expandEditor') : t('plugin.collapseEditor')"
        :aria-label="editorCollapsed ? t('plugin.expandEditor') : t('plugin.collapseEditor')"
        @click="emit('toggleEditor')"
      >
        <span class="i-ri-layout-left-line" />
      </button>

      <NuxtLink
        :to="localePath({ name: 'preview-id', params: { id: reId } })"
        class="is-icon shell-btn" :title="t('plugin.preview')" :aria-label="t('plugin.preview')"
      >
        <span class="i-ri-eye-line" />
      </NuxtLink>

      <button
        class="is-icon shell-btn" type="button" :title="t('plugin.fullscreen')"
        :aria-label="t('plugin.fullscreen')" @click="toggle"
      >
        <span class="i-ri-fullscreen-line" />
      </button>

      <PluginUsageGuide />

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button class="tb-export-btn shell-btn" type="button" :aria-label="t('plugin.export')">
            <span :class="isExporting ? 'i-ri-loader-4-line animate-spin' : 'i-ri-download-2-line'" />
            <span class="tb-hide-sm">{{ t('plugin.export') }}</span>
            <span class="tb-caret i-ri-arrow-down-s-line" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-52">
          <DropdownMenuItem class="text-[13px] gap-2 cursor-pointer" @select="runExport(downloadPrintPdf)">
            <span class="i-ri-printer-line" />
            {{ t('export.exportPdfPrint') }}
          </DropdownMenuItem>
          <DropdownMenuItem class="text-[13px] gap-2 cursor-pointer" @select="runExport(downloadPdf)">
            <span class="i-ri-file-pdf-2-line" />
            {{ t('export.exportPdf') }}
          </DropdownMenuItem>
          <DropdownMenuItem class="text-[13px] gap-2 cursor-pointer" @select="runExport(downloadImg)">
            <span class="i-ri-image-line" />
            {{ t('export.exportImage') }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        class="is-settings shell-btn" :class="{ 'is-on': settingsOpen }" type="button"
        @click="emit('toggleSettings')"
      >
        <span class="i-ri-settings-3-line" />
        <span class="tb-hide-sm">{{ t('plugin.settings') }}</span>
      </button>

      <span class="tb-sep" />

      <PluginSaveInfo :data="data" :auto-save="autoSave" />
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

/* 左右两组用同一个间距，原来左 8 / 右 4 不对称 */
.tb-left,
.tb-right {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.tb-right {
  justify-content: flex-end;
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
  font-size: 14px;
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

/* 分段控件总高 = 26 + 3*2 = 32，与左右两侧按钮同高 */
.tb-seg-btn {
  height: 26px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
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

/* 纯图标按钮：32×32 方块，靠 tooltip 说明 */
.shell-btn.is-icon {
  width: 32px;
  padding: 0;
}

/* 导出是"产出"动作：加一道描边，和一堆 ghost 图标区分开，但不跟保存抢主次 */
.tb-export-btn {
  border: 1px solid hsl(var(--border));
  padding: 0 10px;
}

.tb-export-btn:hover {
  border-color: hsl(var(--ring) / 0.5);
}

.tb-caret {
  font-size: 12px;
  opacity: 0.6;
}

/* 把保存从工具组里隔开（它是主操作，位于最右） */
.tb-sep {
  width: 1px;
  height: 18px;
  margin: 0 2px;
  flex: none;
  background: hsl(var(--border));
}

/* 图标统一到 16px：UnoCSS 图标是 1.2em，挂在 16px 的容器里会变成 19px，和按钮里的 16px 不一致 */
.topbar :deep([class*='i-ri-']) {
  font-size: 13.5px;
}

/* 窄窗口下右侧动作只留图标，避免顶栏溢出 */
@media (max-width: 1180px) {
  .tb-hide-sm {
    display: none;
  }
}
</style>
