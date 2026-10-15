<script lang="ts" setup>
import type { ResumeData } from '~~/types/resume'
import { LabelLoading } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import resumeController from '~/composables/action/resume'

const props = defineProps<{
  data: ResumeData
  autoSave?: boolean
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

// 手动保存（LabelLoading 点按钮，无参 → 弹提示）与自动保存（silent）共用同一个 save
const AUTO_SAVE_DELAY = 1500
const saving = ref(false)
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

function clearAutoSaveTimer() {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
}

async function save(options: { silent?: boolean } = {}) {
  if (saving.value)
    return
  saving.value = true
  try {
    if (!props.data.settings)
      return

    await Promise.all([
      resumeController.saveCurrentResume(props.data),
      resumeController.updateCurrentSettings(props.data.id, props.data.settings),
    ])

    // 保存成功 → 当前数据就是新的基线
    snapshot.value = serialize(props.data)

    // 自动保存成功不弹提示（否则打字时会刷屏）；失败一律弹
    if (!options.silent) {
      toast({
        title: t('toast.saved'),
        variant: 'success',
      })
    }
  }
  catch (error) {
    toast({
      title: t('toast.saveFailed'),
      variant: 'destructive',
    })
    console.error('Save error:', error)
  }
  finally {
    saving.value = false
  }
}

// ---- 自动保存 ----
// 只由「未保存状态」驱动：停下来 1.5 秒才落一次盘，避免打字过程中反复写库。
// 落盘逻辑与手动保存完全共用（同一个 save / 同一个基线快照），所以未保存胶囊会自动翻成"已保存"。
watch([() => props.autoSave, isDirty], ([enabled, dirty]) => {
  clearAutoSaveTimer()
  if (!enabled || !dirty)
    return
  autoSaveTimer = setTimeout(() => {
    autoSaveTimer = null
    void save({ silent: true })
  }, AUTO_SAVE_DELAY)
})

onUnmounted(clearAutoSaveTimer)
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
      <span class="save-btn-inner">{{ t('plugin.save') }}</span>
      <template #loading>
        <span class="save-btn-inner">{{ t('plugin.saving') }}</span>
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
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
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
  padding: 0 12px;
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
