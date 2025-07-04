<script setup lang="ts">
import { LabelLoading } from '../ui/label'

defineProps<{
  onExport: () => void
}>()

const { t } = useI18n()
</script>

<template>
  <LabelLoading :action="onExport">
    <div
      class="plugin-item transition-opacity duration-200 relative"
    >
      <div class="i-ri-download-2-line icon-btn" />
      <Label class="plugin-label">{{ t('export.exportPdf') }}</Label>
    </div>
    <template #loading>
      <span class="text-xs">{{ t('export.exporting') }}</span>
    </template>
  </LabelLoading>
</template>
