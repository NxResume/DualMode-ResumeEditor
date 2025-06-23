<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { pagePaddingList } from '~/constants'
import useSettingStore from '~/stores/settings'

const settingStore = useSettingStore()
const { t } = useI18n()
</script>

<template>
  <Select v-model="settingStore.pagePadding">
    <SelectTrigger class="text-xs p-1 bg-white h-6 w-14 cursor-pointer">
      <SelectValue :placeholder="t('pagePaddingSelect.placeholder')" />
    </SelectTrigger>
    <SelectContent class="min-w-4">
      <SelectGroup>
        <SelectItem v-for="item in pagePaddingList" :key="item.value" class="text-xs cursor-pointer" :value="item.value">
          {{ item.name }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
