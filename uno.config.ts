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
    // 编辑页外壳里所有工具项的统一外观。定义在全局（而不是某个组件的 style 里），
    // 这样插件组件搬到顶栏 / 设置面板任意位置都能自适应主题色（原来的 text-white 只适合深色顶栏）。
    ['plugin-item', 'flex items-center gap-2 px-3 h-8 rounded-lg cursor-pointer select-none text-[13px] text-foreground/80 transition-colors duration-150 hover:bg-accent hover:text-foreground'],
    ['plugin-label', 'text-[13px] font-normal whitespace-nowrap cursor-pointer'],
    ['shell-btn', 'inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-[13px] text-foreground/80 whitespace-nowrap cursor-pointer select-none transition-colors duration-150 hover:bg-accent hover:text-foreground'],
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
