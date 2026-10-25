<script setup lang="ts">
import type { FitOnePageResult } from '~/utils/fitOnePage'

const props = defineProps<{
  content?: string
  themeName?: string
  truncateToOnePage?: boolean
  settings?: ResumeSettings
}>()
// 分页整棵重建后通知外部：预览每行的 y 都变了，跟随滚动需要以编辑器为基准回同步一次
// fitResult：智能一页的适配结果（关闭时为 null），供页面显示状态 / 超出提示
const emit = defineEmits<{
  (e: 'repaginated'): void
  (e: 'fitResult', result: FitOnePageResult | null): void
}>()
const theme = 'markdown-body'
const wrapperRef = ref<HTMLElement | null>(null)
const md = computed(() => useMarkdown(props.content))
// 图片就绪触发的补排每次内容变更只允许一次，避免「重排 → 又出现未加载图片 → 再重排」
let imageRepaginateUsed = false

async function paginateNow() {
  // 图标数据就绪后再渲染，保证首次分页不缺图标
  await ensureIconsLoaded()
  await nextTick()
  // 字体未就绪时是按回退字体折行的，测得的高度与最终渲染不符，必须等
  if (document.fonts)
    await document.fonts.ready
  await new Promise(resolve => setTimeout(resolve, 0))

  const wrapper = wrapperRef.value
  if (!wrapper)
    return

  // 智能一页：先在同一页面上下文里算出行高 / 字号参数，再把处理后的 HTML 交给常规分页。
  // 放得下自然只有一页；超过压缩极限则按最大压缩继续分页，由外部提示用户精简内容。
  let html = md.value.html
  let fit: FitOnePageResult | null = null
  if (props.settings?.fitOnePage) {
    fit = fitOnePage(wrapper, html, { lineHeight: props.settings.pageLineHeight })
    html = fit.content
  }
  else {
    clearLineHeightOverride(wrapper)
  }

  autoPaginate(wrapper, html, {
    ...DEFAULT_CONFIG,
    themeClass: theme,
    themeName: props.themeName,
    padding: props.settings?.pagePadding,
  })

  // 打印导出只克隆 .rs-page-item 节点，行高覆盖必须内联到每一页上才能自包含
  if (fit) {
    for (const page of Array.from(wrapper.querySelectorAll<HTMLElement>('.rs-page-item')))
      applyLineHeightOverride(page, fit.lineHeight)
  }
  emit('fitResult', fit)

  // 重建完成：通知外部回同步滚动（行高/字体/边距/内容变化都会走到这里）
  emit('repaginated')

  scheduleImageRepaginate()
}

// 输入防抖：200ms 内的连续变更合并为一次分页重排，减少打字时的全量 DOM 重建
const paginateDebounced = useDebounceFn(paginateNow, 200)

/** 内容图片（含证件照）加载完成后尺寸变化会让分页失效，只补一次重排 */
function scheduleImageRepaginate() {
  const wrapper = wrapperRef.value
  if (!wrapper || imageRepaginateUsed)
    return

  const pending = Array.from(wrapper.querySelectorAll('img')).filter(img => !img.complete)
  if (!pending.length)
    return

  imageRepaginateUsed = true
  let left = pending.length
  const onDone = () => {
    if (--left === 0)
      paginateDebounced()
  }
  for (const img of pending) {
    img.addEventListener('load', onDone, { once: true })
    img.addEventListener('error', onDone, { once: true })
  }
}

watch(() => [
  props.content,
  props.themeName,
  props.settings?.pagePadding,
  props.settings?.pageLineHeight,
  props.settings?.fontname,
  props.settings?.fitOnePage,
], () => {
  imageRepaginateUsed = false
  paginateDebounced()
})

onMounted(() => {
  // 首次渲染不防抖，进入页面立即分页
  paginateNow()
})
</script>

<template>
  <div ref="wrapperRef" class="rs-page-item-wrapper" :class="theme" />
</template>

<style>
/* 分页样式 */
.rs-page-item-wrapper {
  width: fit-content !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.rs-page-item {
  position: relative;
  width: 794px;
  max-width: 794px;
  /* 与 app/utils/index.ts 的 A4_HEIGHT_PX 必须一致：导出 PDF 时按宽度等比缩放，
     高度不是 A4 比例就会在每页底部多出空白 */
  min-height: 1123px;
  max-height: 1123px;
  background: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  padding: var(--resume-page-padding-size, 36px);
  overflow: hidden;
  z-index: 1;
}

.rs-page-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: var(--resume-page-background) no-repeat;
  background-size: contain;
  z-index: -1;
}

.rs-page-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: var(--resume-page-background) no-repeat;
  background-size: contain;
  z-index: -1;
  pointer-events: none;
}

.rs-line-split {
  width: 794px;
  height: 1px;
  background: #ccc;
  position: relative;
}

.rs-line-split::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -5px;
  height: 10px;
  background: linear-gradient(to right, transparent, #ccc, transparent);
}

/* 空行渲染出的空白块：1 个块 = 1 个行盒的高度（跟随字号与行高设置） */
.md-gap {
  height: calc(var(--resume-line-height, 1.9) * 1em);
}

/* 应用级微调：主题包 h3 默认 margin 0/2px，标题与上下正文贴得太紧；
   选择器多带 .rs-page-item 保证压过主题包且打印稿（拷贝本样式表）一致。
   与相邻 h2 的边距会折叠，只有紧贴列表/段落时这 5px 才生效 */
.markdown-body .rs-page-item h3 {
  margin-top: 5px;
  margin-bottom: 7px;
}

/* h3 下首段（项目简介）与后续列表再留一点缝（主题默认 p 的 margin-bottom 为 0） */
.markdown-body .rs-page-item h3 + p {
  margin-bottom: 2px;
}

.markdown-body .rs-page-item h2 + p {
  margin-bottom: 2px;
}

#id-photo {
  position: absolute;
  z-index: 20;
  width: 140px;
  top: var(--id-photo-top, 37px);
  left: var(--id-photo-left, 581px);
  transform: scale(var(--id-photo-scale, 0.8 0.8));
  border-radius: 6px;
}
</style>
