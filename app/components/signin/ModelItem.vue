<script lang="ts" setup>
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogTrigger from '@/components/ui/dialog/DialogTrigger.vue'

const { signIn } = useAuth()
const showDialog = ref(false)

function handleSignIn(type: 'github' | 'google' | 'gitee') {
  showDialog.value = false
  signIn(type)
}
</script>

<template>
  <Dialog v-model:open="showDialog">
    <DialogTrigger as="template">
      <slot />
    </DialogTrigger>
    <DialogContent>
      <SigninSocialSignInButtons @sign-in="handleSignIn" />
    </DialogContent>
  </Dialog>
</template>
