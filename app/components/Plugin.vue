<script lang="ts" setup>
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import useSettingsStore from '~/stores/settings'

const settingstore = useSettingsStore()
</script>

<template>
  <div class="py-1 bg-[#606060] flex gap-4 w-900px left-39% top-0 fixed">
    <div class="flex items-center space-x-2">
      <Switch id="airplane-mode" :model-value="settingstore.isScrollable" @update:model-value="settingstore.isScrollable = $event" />
      <Label for="airplane-mode" class="text-white font-normal text-xs!">跟随滚动</Label>
    </div>
    <div>
      <SelectModel />
    </div>
  </div>
</template>
