import type { ResumeData } from '~~/types/resume'

/**
 * 编辑页各工具组件共用的字段更新helper：
 * 顶栏（Plugin.vue）和设置面板（PluginSettingsPanel）都只持有 `data` 快照并向外 emit 新对象，
 * 这里统一处理 `settings.xxx` 前缀的浅合并，避免两处各写一份。
 *
 * 注意：只改内存（emit 出去由页面 updateResumeData 接收），不落盘 —— 保存仍由保存按钮负责。
 */
export function useResumeFieldUpdate(
  getData: () => ResumeData,
  onUpdate: (data: ResumeData) => void,
) {
  return function updateField(key: string, value: any) {
    const data = getData()

    if (key.startsWith('settings.')) {
      const settingKey = key.slice('settings.'.length)
      onUpdate({
        ...data,
        settings: {
          ...data.settings,
          [settingKey]: value,
        } as ResumeSettings,
      })
      return
    }

    onUpdate({
      ...data,
      [key]: value,
    })
  }
}
