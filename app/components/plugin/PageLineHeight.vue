<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { pageLineHeightList } from '~/constants'

defineProps<{
  data?: number
}>()

const emit = defineEmits<{
  (e: 'update:data', data: any): void
}>()
</script>

<template>
  <Select :model-value="data" @update:model-value="emit('update:data', $event)">
    <SelectTrigger class="text-xs p-1 bg-white h-6 w-12 cursor-pointer">
      <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24"><path fill="currentColor" d="m5 7.85l-.9.875Q3.825 9 3.413 9T2.7 8.7q-.275-.275-.275-.7t.275-.7l2.6-2.6q.15-.15.325-.212T6 4.425t.375.063t.325.212l2.6 2.6q.275.275.288.688T9.3 8.7q-.275.275-.687.288T7.9 8.725L7 7.85v8.3l.9-.875Q8.175 15 8.588 15t.712.3q.275.275.275.7t-.275.7l-2.6 2.6q-.15.15-.325.213T6 19.575t-.375-.062T5.3 19.3l-2.6-2.6q-.275-.275-.288-.687T2.7 15.3q.275-.275.688-.288t.712.263l.9.875zM13 19q-.425 0-.712-.288T12 18t.288-.712T13 17h8q.425 0 .713.288T22 18t-.288.713T21 19zm0-6q-.425 0-.712-.288T12 12t.288-.712T13 11h8q.425 0 .713.288T22 12t-.288.713T21 13zm0-6q-.425 0-.712-.288T12 6t.288-.712T13 5h8q.425 0 .713.288T22 6t-.288.713T21 7z" /></svg>
    </SelectTrigger>
    <SelectContent class="min-w-4">
      <SelectGroup>
        <SelectItem v-for="item in pageLineHeightList" :key="item.value" class="text-xs cursor-pointer" :value="item.value">
          {{ item.name }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
