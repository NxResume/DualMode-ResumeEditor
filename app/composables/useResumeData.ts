import type { ResumeData } from '~~/types/resume'
import { isClient } from '@vueuse/core'
import resumeController from '~/composables/action/resume'

export function useResumeData() {
  const route = useRoute()

  const currentResume = ref<ResumeData>({
    content: '',
    id: '',
    name: '',
    theme: '',
    plugins: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    settings: getDefaultSettings(),
  })

  // 根据路由参数切换简历
  const resumeId = (route.params as Record<string, any>)?.id as string | undefined

  async function fetchCurrentResume() {
    if (!resumeId)
      return

    currentResume.value = await resumeController.fetchResumeById(resumeId) as ResumeData
  }

  // 监听路由变化
  watch(() => resumeId, () => {
    fetchCurrentResume()
  })

  // 组件挂载时获取数据
  onMounted(() => {
    fetchCurrentResume()
  })

  // 样式同步
  watch(
    () => currentResume.value.settings,
    (settings) => {
      if (settings && isClient) {
        useResumeStyleSync(settings)
      }
    },
    { immediate: true, deep: true },
  )

  // 更新简历数据
  function updateResumeData(data: ResumeData) {
    currentResume.value = data
  }

  return {
    currentResume,
    resumeId,
    fetchCurrentResume,
    updateResumeData,
  }
}
