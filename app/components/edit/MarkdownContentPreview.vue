<script setup lang="ts">
const props = defineProps<{
  content?: string
  themeName?: string
  truncateToOnePage?: boolean
  settings?: ResumeSettings
}>()
const theme = 'markdown-body'
const md = computed(() => useMarkdown(props.content))

function handleAutoPaginate() {
  nextTick(() => {
    setTimeout(() => {
      const wrapper = document.querySelector('.rs-page-item-wrapper')
      if (wrapper) {
        autoPaginate(wrapper as HTMLElement, md.value.html, {
          ...DEFAULT_CONFIG,
          themeClass: theme,
          themeName: props.themeName,
          padding: props.settings?.pagePadding,
        })
      }
    }, 0)
  })
}

watch(() => [
  props.content,
  props.themeName,
  props.settings?.pagePadding,
  props.settings?.pageLineHeight,
  props.settings?.fontname,
], () => {
  handleAutoPaginate()
}, {
  immediate: true,
})

onMounted(() => {
  handleAutoPaginate()
})
</script>

<template>
  <div class="rs-page-item-wrapper" :class="theme" />
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
