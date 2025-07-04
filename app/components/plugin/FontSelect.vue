<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fontList } from '~/constants'

defineProps<{
  data?: string
}>()

const emit = defineEmits<{
  (e: 'update:data', data: any): void
}>()
</script>

<template>
  <Select :model-value="data" @update:model-value="emit('update:data', $event)">
    <SelectTrigger class="text-xs bg-white h-6 w-[100px] cursor-pointer">
      <SelectValue placeholder="Select a font" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem v-for="item in fontList" :key="item.value" class="text-xs cursor-pointer" :value="item.value">
          {{ item.name }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
