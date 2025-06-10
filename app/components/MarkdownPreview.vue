<script setup lang="ts">
const props = defineProps<{
  content: string
}>()

const md = computed(() => useMarkdown(props.content))
</script>

<template>
  <div
    class="preview-content"
  >
    <article class="bg-white prose max-w-[794px]! w-[794px]!" v-html="md.html" />
  </div>
</template>

<style>
.lr-container .left {
  width: 50%;
  float: left;
}

.lr-container .right {
  width: 50%;
  float: right;
}

.lr-container {
  /* 方案1：推荐 */
  overflow: hidden;

  /* 或方案3：推荐 */
  /* &::after { content: ""; display: table; clear: both; } */

  padding: 15px; /* 可选：增加内边距 */
}
</style>
