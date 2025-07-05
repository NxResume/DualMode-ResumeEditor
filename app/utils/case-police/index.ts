import type { Preset } from './utils'
import { DISABLE_KEY, loadPresets, replaceCore } from './utils'

export function replace(code: string, options: {
  ignore?: string[]
  dict?: Record<string, string>
  presets?: Preset[]
} = {}) {
  if (code.includes(DISABLE_KEY))
    return

  const ignore = (options.ignore || []).map(i => i.trim().toLowerCase())
  const dict = {
    ...loadPresets(options.presets),
    ...options.dict,
  }

  return replaceCore(code, dict, ignore)
}

export default replace

export type { CasePoliceReturn, ChangedCase, Preset } from './utils'
