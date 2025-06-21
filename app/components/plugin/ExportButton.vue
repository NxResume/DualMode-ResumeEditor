<script setup lang="ts">
const props = defineProps<{
  onExport: () => void
}>()

const loading = ref(false)
const { t } = useI18n()

async function handleClick() {
  if (loading.value)
    return
  loading.value = true
  try {
    await props.onExport()
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="plugin-item transition-opacity duration-200 relative"
    :class="[{ 'opacity-70 pointer-events-none': loading }]"
    :disabled="loading"
    @click.stop="handleClick"
  >
    <svg v-if="loading" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24"><path fill="none" stroke="#333333" stroke-linecap="round" stroke-width="2" d="M12 6.99998C9.1747 6.99987 6.99997 9.24998 7 12C7.00003 14.55 9.02119 17 12 17C14.7712 17 17 14.75 17 12"><animateTransform attributeName="transform" attributeType="XML" dur="560ms" from="0,12,12" repeatCount="indefinite" to="360,12,12" type="rotate" /></path></svg>
    <div v-else class="i-ri-download-2-line icon-btn" />
    <Label class="plugin-label">{{ loading ? t('export.exporting') : t('export.exportPdf') }}</Label>
    <div v-if="loading" class="flex h-full items-center right-4 absolute">
      <div class="h-4 w-4" />
    </div>
  </div>
</template>
