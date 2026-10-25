<script setup lang="ts">
import type { EditCodeMirror, EditMarkdownPreview } from '#components'
import type { FitOnePageResult } from '~/utils/fitOnePage'
import { useResumeData } from '~/composables/useResumeData'
import { A4_HEIGHT_PX, A4_WIDTH_PX } from '~/utils'

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
const { stop, start, resync } = useScrollSync(leftRef, el)

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

async function handleExport(type: 'pdf' | 'print' | 'png') {
  if (type === 'png')
    return preRef.value?.exportToImage()
  if (type === 'print')
    return preRef.value?.printToPDF()
  return preRef.value?.exportToPDF()
}

/* ------------------------------------------------------------------ */
/* 缩放：页面几何不变（仍是 794 × 1123 = A4 比例），只改外面这层 transform 的倍数 */
/* ------------------------------------------------------------------ */
const PAGE_WIDTH = A4_WIDTH_PX
const PAGE_HEIGHT = A4_HEIGHT_PX

type ZoomMode = 'fit-width' | 'fit-page' | 'custom'
// 进页面默认 100%（真实 A4 尺寸）；想铺满宽度可以点「适应宽度」
const zoomMode = ref<ZoomMode>('custom')
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

// 缩放改变预览的视觉几何（scrollHeight 随 scale 成倍变化），但两侧都不会因此产生
// scroll 事件、分页也不重建（scale 只是 transform，不触发 repaginated）——
// 不主动回同步的话两栏就此错位：在底部缩放时右侧会停在旧位置、看不到文档结尾。
watch(scalePre, () => resync())

// transform-origin 是 top left：内容比画布窄时用 margin 居中。
// 不动布局尺寸，避免影响分页测量与滚动同步。
const centerOffset = computed(() => {
  const rest = canvasWidth.value - PAGE_WIDTH * scalePre.value
  return rest > 0 ? Math.round(rest / 2) : 0
})

const ZOOM_MIN = 40
const ZOOM_MAX = 200

// 编辑器信息条：模式 + 字数
const isSource = computed(() => currentResume.value?.settings?.editorMode === 'source')
const wordCount = computed(() => currentResume.value?.content?.length ?? 0)

// 预览信息条：页数（分页在子组件里做，这里只数结果，用于显示）
const pageCount = ref(0)
let pageObserver: MutationObserver | null = null

function countPages() {
  pageCount.value = canvasRef.value?.querySelectorAll('.rs-page-item').length ?? 0
}

watch(canvasRef, (node) => {
  pageObserver?.disconnect()
  if (!node)
    return
  countPages()
  pageObserver = new MutationObserver(countPages)
  pageObserver.observe(node, { childList: true, subtree: true })
}, { immediate: true })

onUnmounted(() => pageObserver?.disconnect())

/* ------------------------------------------------------------------ */
/* 智能一页：开关是简历设置（随自动保存落盘），适配结果由预览子组件每次分页后回报 */
/* ------------------------------------------------------------------ */
const fitResult = ref<FitOnePageResult | null>(null)
const fitOn = computed(() => !!currentResume.value?.settings?.fitOnePage)
const fitOverflow = computed(() => fitOn.value && !!fitResult.value && !fitResult.value.fits)
const updateField = useResumeFieldUpdate(() => currentResume.value, updateResumeData)

function toggleFitOnePage() {
  updateField('settings.fitOnePage', !fitOn.value)
}

// 只在真的动了参数时显示「行高 x · 字号 y%」；内容本来就一页时不打扰
const fitStatus = computed(() => {
  const result = fitResult.value
  if (!fitOn.value || !result)
    return ''
  if (!result.fits)
    return t('plugin.fitOnePageOverflow')
  const userLineHeight = currentResume.value?.settings?.pageLineHeight ?? result.lineHeight
  if (result.fontScale >= 1 && result.lineHeight >= userLineHeight)
    return ''
  return t('plugin.fitOnePageStatus', { lh: result.lineHeight, scale: Math.round(result.fontScale * 100) })
})

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
const storedWidth = useLocalStorage('nuxt-resume-editor-width', 480)
const storedCollapsed = useLocalStorage('nuxt-resume-editor-collapsed', false)
const storedSettingsOpen = useLocalStorage('nuxt-resume-editor-settings-open', true)
const storedAutoSave = useLocalStorage('nuxt-resume-editor-autosave', true)
const dragging = ref(false)
const dragWidth = ref(0)

// 这三个 UI 状态来自 localStorage，SSR 时读不到 → 服务端与客户端首帧不一致会产生 hydration 警告。
// 首帧统一用默认值，挂载后再切到存储值。
const shellReady = ref(false)
onMounted(() => {
  shellReady.value = true
})

const editorCollapsed = computed({
  get: () => shellReady.value && storedCollapsed.value,
  set: (v: boolean) => { storedCollapsed.value = v },
})
const settingsOpen = computed({
  get: () => shellReady.value ? storedSettingsOpen.value : true,
  set: (v: boolean) => { storedSettingsOpen.value = v },
})

// 自动保存开关：存 localStorage（编辑器偏好，不进简历数据、不动 DB schema），状态由页面独占
const autoSave = computed({
  get: () => shellReady.value && storedAutoSave.value,
  set: (v: boolean) => { storedAutoSave.value = v },
})

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
  const raw = dragging.value ? dragWidth.value : (shellReady.value ? Number(storedWidth.value) || 480 : 480)
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
    storedWidth.value = dragWidth.value
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
    // 左侧主题色面板按编辑器的实际占位来定宽，这样它像"编辑器那一条被换成面板"，
    // 不会露出半截编辑器内容（原来固定 400 会露出 60px）
    root.style.setProperty('--theme-panel-w', `${Math.max(editorVisibleWidth.value || 0, 360)}px`)
  })

  onUnmounted(() => {
    document.documentElement.style.removeProperty('--editor-width')
    document.documentElement.style.removeProperty('--topbar-h')
    document.documentElement.style.removeProperty('--theme-panel-w')
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
      :download-print-pdf="() => handleExport('print')"
      :editor-collapsed="editorCollapsed"
      :settings-open="settingsOpen"
      :auto-save="autoSave"
      @update:data="updateResumeData"
      @toggle-settings="settingsOpen = !settingsOpen"
      @toggle-editor="editorCollapsed = !editorCollapsed"
    />

    <div class="shell-body">
      <!-- 左侧编辑器 -->
      <div
        v-show="!editorCollapsed"
        class="editor-pane"
        :style="{ width: `${editorVisibleWidth}px` }"
      >
        <div class="pane-strip">
          <span class="strip-title">{{ isSource ? t('plugin.source') : t('plugin.wysiwyg') }}</span>
          <span class="strip-meta">{{ t('plugin.words', { n: wordCount }) }}</span>
        </div>
        <div ref="leftRef" class="editor-body">
          <ClientOnly>
            <EditCodeMirror
              :model-value="currentResume?.content" :mode="currentResume.settings?.editorMode"
              @update:model-value="currentResume.content = $event"
            />
          </ClientOnly>
        </div>
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
      <div class="preview-pane">
        <!-- 预览工具条：页数 + 缩放（原来是一个浮在画布上的小药丸，看着很孤立） -->
        <div class="pane-strip">
          <span class="strip-title">{{ t('plugin.preview') }}</span>
          <span v-if="pageCount" class="strip-meta">{{ t('plugin.pageCount', { n: pageCount }) }}</span>
          <button
            class="fit-pill" :class="{ 'is-on': fitOn, 'is-warn': fitOverflow }" type="button"
            :title="t('plugin.fitOnePageHint')" :aria-pressed="fitOn"
            @click="toggleFitOnePage"
          >
            <span class="i-ri-contract-up-down-line" />
            {{ t('plugin.fitOnePage') }}
          </button>
          <span v-if="fitStatus" class="strip-meta" :class="{ 'is-warn': fitOverflow }">{{ fitStatus }}</span>
          <div class="zoom-group">
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
        </div>

        <div ref="el" class="preview-stage">
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
                  }" @repaginated="resync" @fit-result="fitResult = $event"
                />
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧设置面板 -->
      <PluginSettingsPanel
        v-show="settingsOpen"
        :data="currentResume"
        :auto-save="autoSave"
        @update:data="updateResumeData"
        @update:auto-save="autoSave = $event"
        @close="settingsOpen = false"
      />
    </div>
  </div>
</template>

<style scoped>
.edit-shell {
  /* 层次靠明度差做出来：面板（白）/ 预览底板（灰）/ 纸张（白）三档。
     原来的 --muted 是 95.9% 亮度，和白纸只有 1.1:1，纸张完全浮不起来。 */
  --shell-panel: hsl(var(--background));
  --shell-canvas: #e3e5ea;
  --shell-strip-h: 40px;

  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--shell-panel);
}

/* 暗色下纸张仍是白的，底板要更深纸才浮得起来 */
.dark .edit-shell {
  --shell-canvas: #131316;
}

.shell-body {
  flex: 1;
  display: flex;
  min-height: 0;
  position: relative;
}

/* 编辑器：信息条（定高） + 正文（滚动） */
.editor-pane {
  flex: none;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--shell-panel);
}

.editor-body {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

/* 编辑器 / 预览共用的信息条：给两侧内容一个明确的“头”，避免内容直接顶到边缘显得没做完 */
.pane-strip {
  height: var(--shell-strip-h);
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-bottom: 1px solid hsl(var(--border));
  background: var(--shell-panel);
}

.strip-title {
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--foreground) / 0.8);
}

.strip-meta {
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: hsl(var(--muted-foreground));
}

.strip-meta.is-warn {
  color: hsl(var(--destructive));
}

/* 智能一页开关：和页数挨着放，一眼看到「几页」就能顺手压成一页 */
.fit-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 12px;
  color: hsl(var(--foreground) / 0.75);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 150ms,
    color 150ms;
}

.fit-pill:hover {
  background: hsl(var(--accent));
  color: hsl(var(--foreground));
}

.fit-pill.is-on {
  background: hsl(var(--primary) / 0.12);
  color: hsl(var(--primary));
}

.fit-pill.is-on.is-warn {
  background: hsl(var(--destructive) / 0.12);
  color: hsl(var(--destructive));
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

/* 预览：工具条（定高） + 画布（滚动） */
.preview-pane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--shell-canvas);
}

.preview-stage {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: auto;
}

.zoom-group {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
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
  padding: 24px 32px 56px;
}

.preview-scaler {
  width: 100%;
}
</style>
