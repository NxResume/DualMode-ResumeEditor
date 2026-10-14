<script lang="ts" setup>
import type { ResumeData } from '~~/types/resume'
import { LabelLoading } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import resumeController from '~/composables/action/resume'

const props = defineProps<{
  data: ResumeData
}>()
const { toast } = useToast()
const { t } = useI18n()

// ---- 未保存状态 ----
// 全项目只有这里会真的落盘（saveCurrentResume / updateCurrentSettings），其余编辑只改内存，
// 所以“当前数据 === 上次保存时的数据”就是未保存状态的正确定义。
// 简历是异步加载的（useResumeData 在 onMounted 里 fetch），快照必须等数据到位后再取，
// 否则一进页面就会误报“未保存”。
const loadedId = ref('')
const snapshot = ref('')
const hasSnapshot = ref(false)

function serialize(data: ResumeData) {
  // updatedAt/createdAt 由保存流程自己改，不参与比较
  const { updatedAt: _updatedAt, createdAt: _createdAt, ...rest } = data
  return JSON.stringify(rest)
}

watch(
  () => props.data.id,
  (id) => {
    if (!id || id === loadedId.value)
      return
    loadedId.value = id
    snapshot.value = serialize(props.data)
    hasSnapshot.value = true
  },
  { immediate: true },
)

const isDirty = computed(() => hasSnapshot.value && serialize(props.data) !== snapshot.value)

async function save() {
  try {
    if (!props.data.settings)
      return

    await Promise.all([
      resumeController.saveCurrentResume(props.data),
      resumeController.updateCurrentSettings(props.data.id, props.data.settings),
    ])

    // 保存成功 → 当前数据就是新的基线
    snapshot.value = serialize(props.data)

    toast({
      title: 'Saved',
      description: 'Your changes have been saved.',
      variant: 'success',
    })
  }
  catch (error) {
    toast({
      title: 'Save Failed',
      description: 'An error occurred while saving your changes.',
      variant: 'destructive',
    })
    console.error('Save error:', error)
  }
}
</script>

<template>
  <div class="save-block">
    <span
      v-if="hasSnapshot"
      class="save-chip"
      :class="isDirty ? 'is-dirty' : 'is-clean'"
      :title="isDirty ? t('plugin.unsaved') : t('plugin.saved')"
    >
      <span class="chip-dot" />
      {{ isDirty ? t('plugin.unsaved') : t('plugin.saved') }}
    </span>

    <LabelLoading :action="save" class="save-btn">
      <span class="save-btn-inner">
        <span class="i-ri-save-3-line" />
        {{ t('plugin.save') }}
      </span>
      <template #loading>
        <span class="save-btn-inner">
          <span class="i-ri-save-3-line" />
          {{ t('plugin.saving') }}
        </span>
      </template>
    </LabelLoading>
  </div>
</template>

<style scoped>
.save-block {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.save-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 11.5px;
  white-space: nowrap;
  /* 颜色只落在小圆点上，文字保持可读 —— 状态不能只靠颜色传达 */
  color: hsl(var(--foreground) / 0.7);
}

.save-chip.is-clean {
  background: hsl(var(--muted));
}

.save-chip.is-dirty {
  background: rgb(245 158 66 / 14%);
}

.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
}

.save-chip.is-dirty .chip-dot {
  background: #f59e42;
}

.save-btn {
  padding: 0 14px;
  height: 32px;
  border-radius: 8px;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  font-size: 13px;
  transition: opacity 150ms;
}

.save-btn:hover {
  opacity: 0.9;
}

.save-btn-inner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
