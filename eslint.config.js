// @ts-check
import antfu from '@antfu/eslint-config'
import nuxt from './.nuxt/eslint.config.mjs'

export default antfu(
  {
    unocss: true,
    formatters: true,
    pnpm: true,
    vue: true,
  },
)
  .append(nuxt())
