import { ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useBeforeUnload } from './useBeforeUnload'

export function useBeforeLeaveConfirm(message = '你有未保存的更改，确定要离开页面吗？') {
  const showLeaveConfirm = ref(false)
  const pendingNavigation = ref<any>(null)
  const resumeStore = useResumeStore()
  const isContentDirty = computed(() =>
    !!(resumeStore.currentResume && resumeStore.resumeContent !== resumeStore.currentResume.content),
  )
  const isDirty = computed(() => isContentDirty.value)

  useBeforeUnload({
    enabled: isDirty.value,
    message,
  })

  onBeforeRouteLeave((to, from, next) => {
    if (!isDirty.value)
      return next()
    showLeaveConfirm.value = true
    pendingNavigation.value = next
  })
  function handleLeaveConfirm(confirmed: boolean) {
    showLeaveConfirm.value = false
    if (pendingNavigation.value) {
      pendingNavigation.value(confirmed)
      pendingNavigation.value = null
    }
  }

  return {
    showLeaveConfirm,
    handleLeaveConfirm,
  }
}
