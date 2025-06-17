import { useStorage } from '@vueuse/core'
import { skipHydrate } from 'pinia'

const useSettingsStore = defineStore('settings', () => {
  const isScrollable = useStorage('isScrollable', false)

  return {
    isScrollable: skipHydrate(isScrollable),
  }
})

export default useSettingsStore
