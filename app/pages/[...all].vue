<script setup lang="ts">
const router = useRouter()
</script>

<template>
  <main p="x4 y10" text="center teal-700 dark:gray-200">
    <div text-4xl>
      <div i-carbon-warning inline-block />
    </div>
    <div>{{ $t('notFound') }}</div>
    <div>
      <button text-sm btn m="3 t8" @click="router.back()">
        {{ $t('back') }}
      </button>
    </div>
  </main>
</template>
