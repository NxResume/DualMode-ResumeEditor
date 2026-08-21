import { createLocalFontProcessor } from '@unocss/preset-web-fonts/local'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWebFonts,
  presetWind4,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import presetAnimations from 'unocss-preset-animations'
import { presetShadcn } from 'unocss-preset-shadcn'

export default defineConfig({
  shortcuts: [
    ['btn', 'px-4 py-1 rounded inline-block bg-teal-600 text-white cursor-pointer hover:bg-teal-700 disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50'],
    ['icon-btn', 'inline-block cursor-pointer select-none opacity-75 transition duration-200 ease-in-out hover:opacity-100 hover:text-teal-600'],
  ],
  theme: {
    colors: {
      'success': '#22c55e',
      'success-foreground': '#fff',
      'info': '#3b82f6',
      'info-foreground': '#fff',
      'warning': '#f59e42',
      'warning-foreground': '#fff',
    },
  },
  presets: [
    presetWind4(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      // 显式声明图标集，避免依赖预设内部的 node 加载器。
      // 在 TraeCode/VSCode 集成终端中会注入 VSCODE_CWD 环境变量，
      // 导致 UnoCSS 误判为“运行在 VSCode 内”而跳过 node 图标加载器，
      // 使 i-ri-* 图标全部解析为空（header 设置图标等消失）。详见 getEnvFlags()。
      collections: {
        ri: () => import('@iconify-json/ri').then(m => m.icons),
      },
    }),
    presetTypography(),
    presetWebFonts({
      fonts: {
        sans: 'DM Sans',
        serif: 'DM Serif Display',
        mono: 'DM Mono',
      },
      processors: createLocalFontProcessor(),
    }),
    presetShadcn(
      // {
      //   color: 'red',
      //   // With default setting for SolidUI, you need to set the darkSelector option.
      //   darkSelector: '[data-kb-theme="dark"]',
      // },
      // {
      //   // If you are using reka ui.
      //   componentLibrary: 'reka',
      // },
    ),
    presetAnimations(),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],

  content: {
    pipeline: {
      include: [
        // the default
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        // include js/ts files
        '(components|src)/**/*.{js,ts}',
      ],
    },
  },
})
