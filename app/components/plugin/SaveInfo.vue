<script setup lang="ts">
import type { ResumeData } from '~~/types/resume'
import { LabelLoading } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import resumeController from '~/composables/action/resume'

const props = defineProps<{
  data: ResumeData
}>()
const { toast } = useToast()

async function save() {
  try {
    if (!props.data.settings)
      return

    await Promise.all([
      resumeController.saveCurrentResume(props.data),
      resumeController.updateCurrentSettings(props.data.id, props.data.settings),
    ])

    toast({
      title: 'Saved',
      description: 'Your changes have been saved.',
      variant: 'success',
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
  <LabelLoading :action="save">
    <div class="plugin-item">
      <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 512 512"><path fill="currentColor" d="m465.94 119.76l-73.7-73.7A47.68 47.68 0 0 0 358.3 32H96a64 64 0 0 0-64 64v320a64 64 0 0 0 64 64h320a64 64 0 0 0 64-64V153.7a47.68 47.68 0 0 0-14.06-33.94M120 112h176a8 8 0 0 1 8 8v48a8 8 0 0 1-8 8H120a8 8 0 0 1-8-8v-48a8 8 0 0 1 8-8m139.75 319.91a80 80 0 1 1 76.16-76.16a80.06 80.06 0 0 1-76.16 76.16" /><circle cx="256" cy="352" r="48" fill="currentColor" /></svg>
      <Label class="plugin-label">{{ $t('plugin.save') }}</Label>
    </div>
    <template #loading>
      <span class="text-xs">
        saving...
      </span>
    </template>
  </LabelLoading>
</template>
