import { pwa } from './app/config/pwa'

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
  ],
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Markdown 简历编辑器',
      viewport: 'width=device-width,initial-scale=1',
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/svg+xml', href: '/nuxt.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '一个专业的 Markdown 简历编辑器，支持实时预览和一键导出 PDF' },
        { name: 'keywords', content: '简历, Markdown, 编辑器, PDF, 在线工具' },
        { name: 'author', content: 'Resume Editor Team' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#ffffff' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#1a1a1a' },
        { property: 'og:title', content: 'Markdown 简历编辑器' },
        { property: 'og:description', content: '一个专业的 Markdown 简历编辑器，支持实时预览和一键导出 PDF' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://resume.ryanuo.cc' },
        { property: 'og:image', content: '/og-image.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Markdown 简历编辑器' },
        { name: 'twitter:description', content: '一个专业的 Markdown 简历编辑器，支持实时预览和一键导出 PDF' },
        { name: 'twitter:image', content: '/og-image.png' },
      ],
    },
  },
  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },

  build: {
    transpile: ['resume-theme'],
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
  compatibilityDate: '2024-08-14',
  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
    prerender: {
      crawlLinks: false,
      routes: ['/', '/edit'],
      ignore: ['/hi'],
    },
  },
  vite: {
    worker: {
      format: 'es',
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
