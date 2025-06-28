<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const resumeStore = useResumeStore()
</script>

<template>
  <AlertDialog>
    <AlertDialogTrigger>
      <slot />
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ $t('resetResume.title') }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ $t('resetResume.description') }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ $t('resetResume.cancel') }}</AlertDialogCancel>
        <AlertDialogAction @click="resumeStore.resetCurrentResume">
          {{ $t('resetResume.action') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
