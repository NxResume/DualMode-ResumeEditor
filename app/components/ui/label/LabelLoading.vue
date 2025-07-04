<script setup lang="ts">
const props = defineProps<{
  class?: string
  action?: () => any
}>()

const loading = ref(false)

async function handleClick() {
  if (loading.value || !props.action)
    return
  loading.value = true
  try {
    await props.action()
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <span
    :class="props.class"
    style="display: inline-flex; align-items: center; cursor: pointer;"
    @click="handleClick"
  >
    <template v-if="loading">
      <svg class="mr-2 h-4 w-4 inline-block animate-spin" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <slot name="loading"><span class="text-xs">Loading...</span></slot>
    </template>
    <template v-else>
      <slot />
    </template>
  </span>
</template>
