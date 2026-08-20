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
    // Cloudflare Pages Functions + Hyperdrive 部署（Nitro preset）
    // 用法：
    //   生产：    NITRO_PRESET=cloudflare_pages pnpm build
    //   本地调试：pnpm add -D wrangler && wrangler pages dev .output/public --compatibility-flags=nodejs_compat
    // 说明：
    //   - 开启 nodejs_compat，mysql2/bcrypt/nodemailer 等 Node API 依赖能在 Workers 运行
    //   - Prisma 6.x 使用 wasm engine（见 app/utils/db.ts），不需要 Driver Adapter
    //   - DATABASE_URL 由 Pages Functions 的 env 动态拼接 Hyperdrive host/port/user/password/database
    // ============================================================
    // eslint-disable-next-line node/prefer-global/process -- Nitro 配置读 env 的标准方式
    preset: process.env.NITRO_PRESET === 'cloudflare_pages' ? 'cloudflare_pages' : 'node-server',
    rollupConfig: {
      external: [
        // Prisma wasm engine 与引擎二进制，rollup 不要打包，保留动态 require
        '@prisma/client',
        '@prisma/engines',
        '@prisma/engines-version',
        // Node 原生模块（Workers 上由 nodejs_compat 提供）
        'node:crypto',
        'node:buffer',
        'node:stream',
        'node:util',
        'node:events',
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
