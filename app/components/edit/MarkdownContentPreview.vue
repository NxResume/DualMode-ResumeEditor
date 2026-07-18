<script setup lang="ts">
const props = defineProps<{
  content?: string
  themeName?: string
  truncateToOnePage?: boolean
  settings?: ResumeSettings
}>()
const theme = 'markdown-body'
const wrapperRef = ref<HTMLElement | null>(null)
const md = computed(() => useMarkdown(props.content))

async function paginateNow() {
  // 图标数据就绪后再渲染，保证首次分页不缺图标
  await ensureIconsLoaded()
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 0))

  if (wrapperRef.value) {
    autoPaginate(wrapperRef.value, md.value.html, {
      ...DEFAULT_CONFIG,
      themeClass: theme,
      themeName: props.themeName,
      padding: props.settings?.pagePadding,
    })
  }
}

// 输入防抖：200ms 内的连续变更合并为一次分页重排，减少打字时的全量 DOM 重建
const paginateDebounced = useDebounceFn(paginateNow, 200)

watch(() => [
  props.content,
  props.themeName,
  props.settings?.pagePadding,
  props.settings?.pageLineHeight,
  props.settings?.fontname,
], () => {
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
  min-height: 1070px;
  max-height: 1070px;
  background: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  padding: var(--resume-page-padding-size, '36px');
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

/* 临时容器样式 */
.temp-container {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  width: 794px;
}

#id-photo {
  position: absolute;
  z-index: 20;
  width: 140px;
  top: var(--id-photo-top, 66px);
  left: var(--id-photo-left, 391px);
  transform: scale(var(--id-photo-scale, '0.8 0.8'));
  border-radius: 6px;
}
</style>
