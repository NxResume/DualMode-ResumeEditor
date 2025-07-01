<script setup lang="ts">
const { status } = useAuth()

definePageMeta({
  layout: false,
})

watchEffect(() => {
  if (status.value === 'authenticated') {
    navigateTo('/')
  }
})

if (status.value === 'authenticated') {
  await navigateTo('/')
}
</script>

<template>
  <div class="px-4 py-12 bg-gray-50 flex min-h-screen items-center justify-center lg:px-8 sm:px-6">
    <div class="max-w-md w-full space-y-8">
      <SigninSocialSignInButtons />
    </div>
  </div>
</template>
