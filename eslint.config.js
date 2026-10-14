// @ts-check
import antfu from '@antfu/eslint-config'
import nuxt from './.nuxt/eslint.config.mjs'

export default antfu(
  {
    // `.hermes/` 是本地计划/草稿目录，与仓库代码无关，不参与 lint
    ignores: ['.hermes/**'],
    unocss: true,
    formatters: true,
    pnpm: true,
    vue: true,
  },
)
  .append(nuxt())
