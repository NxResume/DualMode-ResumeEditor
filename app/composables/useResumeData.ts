import type { ResumeData } from '~~/types/resume'
import { isClient } from '@vueuse/core'
import resumeController from '~/composables/action/resume'

export function useResumeData() {
  const route = useRoute()
  const storageManager = useStorageManager()
  const { currentMode } = storageManager

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

  // 根据路由参数切换简历（computed 保证路由变化时响应式更新）
  const resumeId = computed(() => (route.params as Record<string, any>)?.id as string | undefined)

  async function fetchCurrentResume() {
    if (!resumeId.value)
      return

    const result = await resumeController.fetchResumeById(resumeId.value) as ResumeData | undefined
    // 远端无数据（例如首次 fetch 用了本地 provider 查云端简历）→ 不覆盖，留给 mode 变化后的重试
    if (!result) {
      console.warn('[useResumeData] fetchCurrentResume: 远端无数据，跳过（等待存储模式就绪后重试）')
      return
    }
    if (!result.settings) {
      result.settings = getDefaultSettings()
    }

    currentResume.value = result
  }

  // 监听路由变化
  watch(resumeId, () => {
    fetchCurrentResume()
  })

  // 存储模式变化后重新拉取（解决 initializeMode 晚于子组件 onMounted 的时序问题）
  watch(currentMode, () => {
    fetchCurrentResume()
  })

  // 组件挂载时获取数据
  onMounted(() => {
    fetchCurrentResume()
  })

  // 样式同步：只注册一次，getter 始终跟踪最新的 settings 对象
  // （旧写法在 deep watch 回调里反复调用 useResumeStyleSync，每次变更都新注册一批 watcher，造成泄漏）
  if (isClient) {
    useResumeStyleSync(() => currentResume.value.settings)
  }

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
