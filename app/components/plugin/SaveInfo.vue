<script setup lang="ts">
import { useToast } from '../ui/toast'

const { toast } = useToast()
const resumeStore = useResumeStore()
const resumeSettingsStore = useResumeSettingsStore()

async function save() {
  try {
    await Promise.all([
      resumeStore.saveCurrentResume(),
      resumeSettingsStore.saveCurrentSettings(),
    ])

    toast({
      title: 'Saved',
      description: 'Your changes have been saved.',
      variant: "success"
    })
  }
  catch (error) {
    toast({
      title: 'Save Failed',
      description: 'An error occurred while saving your changes.',
      variant: 'destructive', // 如果你的 toast 支持不同类型
    })
    console.error('Save error:', error)
  }
}
</script>

<template>
  <div class="plugin-item" @click="save">
    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 512 512"><path fill="currentColor" d="m465.94 119.76l-73.7-73.7A47.68 47.68 0 0 0 358.3 32H96a64 64 0 0 0-64 64v320a64 64 0 0 0 64 64h320a64 64 0 0 0 64-64V153.7a47.68 47.68 0 0 0-14.06-33.94M120 112h176a8 8 0 0 1 8 8v48a8 8 0 0 1-8 8H120a8 8 0 0 1-8-8v-48a8 8 0 0 1 8-8m139.75 319.91a80 80 0 1 1 76.16-76.16a80.06 80.06 0 0 1-76.16 76.16" /><circle cx="256" cy="352" r="48" fill="currentColor" /></svg>
    <Label class="plugin-label">{{ $t('plugin.save') }}</Label>
  </div>
</template>
