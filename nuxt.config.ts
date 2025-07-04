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
    routeRules: {
      '/flask-upload': {
        proxy: devApi,
        cors: true,
      },
    },

    esbuild: {
      options: {
        target: 'esnext',
      },
    },
    devProxy: {
      '/flask-upload': {
        target: devApi,
        changeOrigin: true,
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
