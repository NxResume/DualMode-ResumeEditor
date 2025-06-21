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
import useSettingStore from '~/stores/settings'

const settingStore = useSettingStore()

onMounted(() => {
  settingStore.loadFont()
})
</script>

<template>
  <Select v-model="settingStore.fontname">
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
