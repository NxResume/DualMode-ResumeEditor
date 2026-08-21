import { fileURLToPath } from 'node:url'
import { pwa } from './app/config/pwa'

const devApi = 'http://localhost:7777/api/meituan'

export default defineNuxtConfig({
  modules: [
    '@unocss/nuxt',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode',
    '@vite-pwa/nuxt',
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    'shadcn-nuxt',
    '@sidebase/nuxt-auth',
  ],
  // /flask-upload 本地代理仅开发环境生效（生产由客户端直连线上接口，见 IdPhoto.vue）
  $development: {
    nitro: {
      routeRules: {
        '/flask-upload': {
          proxy: devApi,
          cors: true,
        },
      },
      devProxy: {
        '/flask-upload': {
          target: devApi,
          changeOrigin: true,
        },
      },
    },
  },
  devtools: { enabled: true },
  app: {
    head: {
      viewport: 'width=device-width,initial-scale=1',
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/svg+xml', href: '/nuxt.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },

  build: {
    transpile: ['resume-theme', 'vue3-moveable'],
  },
  future: {
    compatibilityVersion: 4,
  },
  experimental: {
    // when using generate, payload js assets included in sw precache manifest
    // but missing on offline, disabling extraction it until fixed
    payloadExtraction: false,
    renderJsonPayloads: true,
    typedPages: true,
  },
  compatibilityDate: '2025-03-25',
  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
    // ============================================================
    // Cloudflare Pages Functions + D1 部署（Nitro preset）
    // 用法：
    //   生产：    NITRO_PRESET=cloudflare_pages pnpm build
    //   本地调试：pnpm dev（node-server + better-sqlite3 本地文件）
    // 说明：
    //   - D1 是原生 SQLite（HTTP 协议），Drizzle 走 drizzle-orm/d1，无 mysql2/Hyperdrive
    //   - bcrypt/nodemailer 依赖 nodejs_compat（wrangler.jsonc 已开）
    // ============================================================
    // eslint-disable-next-line node/prefer-global/process -- Nitro 配置读 env 的标准方式
    preset: process.env.NITRO_PRESET === 'cloudflare_pages' ? 'cloudflare_pages' : 'node-server',
    // @panva/hkdf 的 rollup CJS 互操作在 workerd 下崩（缺 __esModule 导致
    // Babel _interopRequireDefault 二次包裹），用本地 shim 替代，见 scripts/hkdf-shim.mjs
    alias: {
      '@panva/hkdf': fileURLToPath(new URL('./scripts/hkdf-shim.mjs', import.meta.url)),
    },
    rollupConfig: {
      external: [
        // Node 原生模块（Workers 上由 nodejs_compat 提供）
        'node:crypto',
        'node:stream',
        'node:util',
        'node:events',
        'node:module',
        // better-sqlite3 仅本地 Node 分支动态加载（createRequire），不要打进 Workers bundle
        'better-sqlite3',
        'drizzle-orm/better-sqlite3',
        // nodemailer 是 CJS 库，打进 ESM bundle 后 class 继承会崩；
        // 保持运行时导入：本地 Node 正常发邮件，Workers 上导入失败走降级分支
        'nodemailer',
      ],
    },
    // 把 wrangler.jsonc 里的 Hyperdrive binding 注入到 runtime（env.HYPERDRIVE）
    cloudflare: {
      pages: {
        routes: {
          exclude: [],
        },
      },
    },
  },
  vite: {
    worker: {
      format: 'es',
    },
  },

  auth: {
    isEnabled: true,
    disableServerSideAuth: false,
    originEnvKey: 'AUTH_ORIGIN',
    provider: {
      type: 'authjs',
    },
    sessionRefresh: {
      enablePeriodically: 1000 * 60 * 5, // 5 分钟刷新一次
      enableOnWindowFocus: true,
    },
  },

  eslint: {
    config: {
      standalone: false,
      nuxt: {
        sortConfigKeys: true,
      },
    },
  },
  i18n: {
    locales: [
      {
        code: 'zh',
        file: 'zh.json',
        name: '中文',
      },
      {
        code: 'en',
        file: 'en.json',
        name: 'English',
      },
    ],
    defaultLocale: 'zh',
    detectBrowserLanguage: {
      useCookie: true, // 禁用 Cookie 保存语言
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
  },
  pwa,

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    componentDir: '~/components/ui',
  },
})
