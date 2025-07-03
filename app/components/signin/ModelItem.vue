<script lang="ts" setup>
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogTrigger from '@/components/ui/dialog/DialogTrigger.vue'

const showDialog = ref(false)

function callback() {
  showDialog.value = false
}
</script>

<template>
  <Dialog v-model:open="showDialog">
    <DialogTrigger as="template">
      <slot />
    </DialogTrigger>
    <DialogContent>
      <SigninSocialSignInButtons :callback="callback" />
    </DialogContent>
  </Dialog>
</template>
