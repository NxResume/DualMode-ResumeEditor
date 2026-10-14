<script setup lang="ts">
import type { EditCodeMirror, EditMarkdownPreview } from '#components'
import { useResumeData } from '~/composables/useResumeData'
import { A4_WIDTH_PX } from '~/utils'

const { currentResume, updateResumeData } = useResumeData()
const { t } = useI18n()

const el = useTemplateRef('el') // 预览滚动容器（跟随滚动用）
const leftRef = useTemplateRef('leftRef') // 编辑器滚动容器（跟随滚动用）
const canvasRef = useTemplateRef('canvasRef') // 预览画布：量可用宽高来算缩放
const preRef = ref<InstanceType<typeof EditMarkdownPreview>>()

definePageMeta({
  layout: 'default',
  // 不使用全局 sidebase-auth 中间件：本地模式允许匿名访问，database 模式在客户端守卫中跳转
})

// 客户端运行时守卫：database 模式 + 未登录 → 跳回简历列表（那里有登录引导，也可去设置切换本地模式）
const storageManager = useStorageManager()
const { currentMode } = storageManager
const { status } = useAuth()
const router = useRouter()
const localePath = useLocalePath()

function requireAuthIfDatabase() {
  if (import.meta.client && currentMode.value === 'database' && status.value !== 'authenticated') {
    router.push(localePath('resumes'))
  }
}

// 跟随滚动：监听必须挂在容器真正存在之后（settings.isScrollable 初始为 true 时，
// immediate 的 watch 在 setup 阶段就会触发，此时 ref 还是 null，会静默挂不上监听）
const { stop, start } = useScrollSync(leftRef, el)

onMounted(() => {
  requireAuthIfDatabase()
  if (currentResume.value?.settings?.isScrollable)
    start()
})
// 登录态 / 存储模式在页面停留期间发生变化时也重新校验（例如用户打开编辑页后中途退出登录）
watch([currentMode, status], requireAuthIfDatabase)

onUnmounted(stop)

watch(() => currentResume.value?.settings?.isScrollable, (newValue) => {
  if (newValue) {
    start()
  }
  else {
    stop()
  }
})

async function handleExport(type: 'pdf' | 'png') {
  if (type === 'png') {
    return preRef.value?.exportToImage()
  }

  return preRef.value?.exportToPDF()
}

/* ------------------------------------------------------------------ */
/* 缩放：页面几何不变（仍是 794 × 1070），只改外面这层 transform 的倍数   */
/* ------------------------------------------------------------------ */
const PAGE_WIDTH = A4_WIDTH_PX
const PAGE_HEIGHT = 1070

type ZoomMode = 'fit-width' | 'fit-page' | 'custom'
const zoomMode = ref<ZoomMode>('fit-width')
const zoomPercent = ref(100)

const { width: canvasWidth } = useElementSize(canvasRef)
// 「适应页高」必须按预览容器（可视高度）算：画布高度是随内容增长的，量它会得到内容高而不是可视高
const { height: paneHeight } = useElementSize(el)
// 画布上下内边距 20 + 48，再留一点余量给顶部浮层
const FIT_PAGE_INSET = 80

const fitWidthScale = computed(() => (canvasWidth.value ? canvasWidth.value / PAGE_WIDTH : 1))
const fitPageScale = computed(() => {
  const avail = paneHeight.value - FIT_PAGE_INSET
  return avail > 0 ? avail / PAGE_HEIGHT : 1
})

const scalePre = computed(() => {
  if (zoomMode.value === 'fit-width')
    return fitWidthScale.value
  if (zoomMode.value === 'fit-page')
    return fitPageScale.value
  return zoomPercent.value / 100
})

const zoomLabel = computed(() => `${Math.round(scalePre.value * 100)}%`)

// transform-origin 是 top left：内容比画布窄时用 margin 居中。
// 不动布局尺寸，避免影响分页测量与滚动同步。
const centerOffset = computed(() => {
  const rest = canvasWidth.value - PAGE_WIDTH * scalePre.value
  return rest > 0 ? Math.round(rest / 2) : 0
})

const ZOOM_MIN = 40
const ZOOM_MAX = 200

function zoomStep(delta: number) {
  const next = Math.round(scalePre.value * 100) + delta
  zoomPercent.value = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next))
  zoomMode.value = 'custom'
}

function setActualSize() {
  zoomPercent.value = 100
  zoomMode.value = 'custom'
}

/* ------------------------------------------------------------------ */
/* 分栏：编辑器宽度可拖、可收（纯 UI 状态，与简历数据无关）              */
/* ------------------------------------------------------------------ */
const editorWidth = useLocalStorage('nuxt-resume-editor-width', 480)
const editorCollapsed = useLocalStorage('nuxt-resume-editor-collapsed', false)
const settingsOpen = useLocalStorage('nuxt-resume-editor-settings-open', true)
const dragging = ref(false)
const dragWidth = ref(0)

const EDITOR_MIN = 320
const EDITOR_MAX = 720

const shellRef = useTemplateRef('shellRef')

/** 编辑器最多占外壳宽度的 45%，否则窄窗口下预览会被挤到看不清 */
function editorHardMax() {
  const w = shellRef.value?.clientWidth || 0
  return w ? Math.min(EDITOR_MAX, Math.round(w * 0.45)) : EDITOR_MAX
}

const editorVisibleWidth = computed(() => {
  if (editorCollapsed.value)
    return 0
  const raw = dragging.value ? dragWidth.value : editorWidth.value
  const hardMax = Math.max(EDITOR_MIN, editorHardMax())
  return Math.min(hardMax, Math.max(EDITOR_MIN, Number(raw) || 480))
})

function startResize(event: PointerEvent) {
  event.preventDefault()
  const startX = event.clientX
  const startWidth = editorVisibleWidth.value
  dragging.value = true
  dragWidth.value = startWidth

  const onMove = (ev: PointerEvent) => {
    const hardMax = Math.max(EDITOR_MIN, editorHardMax())
    dragWidth.value = Math.min(hardMax, Math.max(EDITOR_MIN, startWidth + (ev.clientX - startX)))
  }
  const onUp = () => {
    // 拖动过程只改内存，松手才落盘（避免 pointermove 每帧写 localStorage）
    editorWidth.value = dragWidth.value
    dragging.value = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

// 主题色面板等浮层是 teleport 到 body 的，拿不到组件内的 CSS 变量，所以写到 documentElement 上
if (import.meta.client) {
  watchEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--editor-width', `${editorVisibleWidth.value}px`)
    root.style.setProperty('--topbar-h', '56px')
  })

  onUnmounted(() => {
    document.documentElement.style.removeProperty('--editor-width')
    document.documentElement.style.removeProperty('--topbar-h')
  })
}
</script>

<template>
  <div ref="shellRef" class="edit-shell">
    <!-- 顶栏：返回 / 简历名 / 保存状态 / 模式切换 / 动作 -->
    <Plugin
      :data="currentResume"
      :download-img="() => handleExport('png')"
      :download-pdf="() => handleExport('pdf')"
      :editor-collapsed="editorCollapsed"
      :settings-open="settingsOpen"
      @update:data="updateResumeData"
      @toggle-settings="settingsOpen = !settingsOpen"
      @toggle-editor="editorCollapsed = !editorCollapsed"
    />

    <div class="shell-body">
      <!-- 左侧编辑器 -->
      <div
        v-show="!editorCollapsed"
        ref="leftRef"
        class="editor-pane"
        :style="{ width: `${editorVisibleWidth}px` }"
      >
        <ClientOnly>
          <EditCodeMirror
            :model-value="currentResume?.content" :mode="currentResume.settings?.editorMode"
            @update:model-value="currentResume.content = $event"
          />
        </ClientOnly>
      </div>

      <!-- 分栏拖拽条（双击收起编辑器） -->
      <div
        v-show="!editorCollapsed"
        class="pane-divider" :class="{ 'is-dragging': dragging }"
        role="separator"
        aria-orientation="vertical"
        @pointerdown="startResize"
        @dblclick="editorCollapsed = true"
      />

      <!-- 右侧预览 -->
      <div ref="el" class="preview-pane">
        <!-- 缩放控制：sticky 浮在画布右上角，不占布局高度，页面顶部不会再被压住 -->
        <div class="zoom-bar">
          <button class="zoom-btn" type="button" :title="t('plugin.zoomOut')" @click="zoomStep(-10)">
            −
          </button>
          <span class="zoom-value">{{ zoomLabel }}</span>
          <button class="zoom-btn" type="button" :title="t('plugin.zoomIn')" @click="zoomStep(10)">
            +
          </button>
          <span class="zoom-sep" />
          <button
            class="zoom-btn" :class="{ 'is-on': zoomMode === 'fit-width' }" type="button"
            @click="zoomMode = 'fit-width'"
          >
            {{ t('plugin.zoomFitWidth') }}
          </button>
          <button
            class="zoom-btn" :class="{ 'is-on': zoomMode === 'fit-page' }" type="button"
            @click="zoomMode = 'fit-page'"
          >
            {{ t('plugin.zoomFitPage') }}
          </button>
          <button
            class="zoom-btn" :class="{ 'is-on': zoomMode === 'custom' && zoomPercent === 100 }" type="button"
            @click="setActualSize"
          >
            100%
          </button>
        </div>

        <div ref="canvasRef" class="preview-canvas">
          <div
            class="preview-scaler"
            :style="{
              scale: scalePre || 1,
              transformOrigin: 'top left',
              marginLeft: `${centerOffset}px`,
            }"
          >
            <ClientOnly>
              <EditMarkdownPreview
                ref="preRef" :content="currentResume?.content" :settings="currentResume?.settings"
                :theme="currentResume?.theme" @update:image-position="(e) => {
                  if (currentResume.settings)
                    currentResume.settings.imagePosition = e
                }" @update:content="(e) => {
                  if (currentResume.content && e)
                    currentResume.content = e
                }"
              />
            </ClientOnly>
          </div>
        </div>
      </div>

      <!-- 右侧设置面板 -->
      <PluginSettingsPanel
        v-show="settingsOpen"
        :data="currentResume"
        @update:data="updateResumeData"
        @close="settingsOpen = false"
      />
    </div>
  </div>
</template>

<style scoped>
.edit-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: hsl(var(--background));
}

.shell-body {
  flex: 1;
  display: flex;
  min-height: 0;
  position: relative;
}

.editor-pane {
  flex: none;
  min-width: 0;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  background: hsl(var(--background));
}

.pane-divider {
  width: 6px;
  flex: none;
  cursor: col-resize;
  position: relative;
  background: transparent;
}

.pane-divider::after {
  content: '';
  position: absolute;
  inset: 0 auto 0 2px;
  width: 2px;
  background: hsl(var(--border));
  transition: background-color 150ms;
}

.pane-divider:hover::after,
.pane-divider.is-dragging::after {
  background: hsl(var(--ring));
}

.preview-pane {
  flex: 1;
  min-width: 0;
  position: relative;
  overflow: auto;
  background: hsl(var(--muted));
}

.zoom-bar {
  position: sticky;
  top: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 2px;
  width: fit-content;
  margin: 12px 16px -42px auto;
  padding: 3px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--background));
  box-shadow: 0 2px 8px rgb(15 23 42 / 8%);
}

.zoom-btn {
  min-width: 30px;
  height: 26px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 12px;
  color: hsl(var(--foreground) / 0.75);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 150ms,
    color 150ms;
}

.zoom-btn:hover,
.zoom-btn.is-on {
  background: hsl(var(--accent));
  color: hsl(var(--foreground));
}

.zoom-value {
  min-width: 42px;
  padding: 0 2px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: hsl(var(--foreground) / 0.75);
  text-align: center;
}

.zoom-sep {
  width: 1px;
  height: 16px;
  margin: 0 4px;
  background: hsl(var(--border));
}

.preview-canvas {
  padding: 20px 32px 48px;
}

.preview-scaler {
  width: 100%;
}
</style>
