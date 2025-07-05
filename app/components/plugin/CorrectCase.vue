<script lang="ts" setup>
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { replace } from '~/utils/case-police'

const props = defineProps<{
  content: string
}>()

const emit = defineEmits<{
  (e: 'update:content', content: string): void
}>()

const { toast } = useToast()

function correct() {
  try {
    if (!props.content || props.content.trim() === '') {
      toast({
        title: 'No content to correct',
        description: 'Please add some content before using case correction.',
        variant: 'destructive',
      })
      return
    }

    const result = replace(props.content)

    if (!result) {
      toast({
        title: 'No changes needed',
        description: 'The content case is already correct.',
      })
      return
    }

    const correctedContent = result.code

    if (correctedContent === props.content) {
      toast({
        title: 'No changes needed',
        description: 'The content case is already correct.',
      })
      return
    }

    emit('update:content', correctedContent)

    // 构建修正单词的列表
    let correctionMessage = 'Text case has been automatically corrected.'
    if (result.changed && result.changed.length > 0) {
      const corrections = result.changed.map(word => `${word.from} → ${word.to}`).join(', ')
      correctionMessage = `Corrected: ${corrections}`
    }

    toast({
      title: 'Case corrected',
      description: correctionMessage,
      variant: 'success',
    })
  }
  catch (error) {
    console.error('Case correction error:', error)
    toast({
      title: 'Correction failed',
      description: 'An error occurred while correcting the text case.',
      variant: 'destructive',
    })
  }
}
</script>

<template>
  <div class="plugin-item" @click.stop="correct">
    <div class="i-ri-book-marked-line icon-btn" />
    <Label class="plugin-label">{{ $t('plugin.correctcase') }}</Label>
  </div>
</template>
