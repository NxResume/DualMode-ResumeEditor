import { createRequire } from 'node:module'

// openid-client 被打包成全局 fetch（见 patches/openid-client.patch），
// 而 Node 的 undici fetch 默认不读 HTTP_PROXY/HTTPS_PROXY，导致本地访问
// Google 等被墙的 OAuth 端点（oauth2.googleapis.com）超时。
// 这里用 EnvHttpProxyAgent 读环境变量代理，仅本地 Node 生效。
//
// 生产 Cloudflare Pages（workerd）不注入代理环境变量、边缘直连无需代理，
// 插件会直接 return，不影响部署态行为。
export default defineNitroPlugin(() => {
  const env = process.env
  const httpProxy = env.HTTP_PROXY || env.http_proxy
  const httpsProxy = env.HTTPS_PROXY || env.https_proxy
  if (!httpProxy && !httpsProxy)
    return

  try {
    const require = createRequire(import.meta.url)
    const { setGlobalDispatcher, EnvHttpProxyAgent } = require('undici') as typeof import('undici')
    setGlobalDispatcher(new EnvHttpProxyAgent({
      httpProxy,
      httpsProxy,
      noProxy: env.NO_PROXY || env.no_proxy || 'localhost,127.0.0.1',
    }))
  }
  catch {
    // workerd（Cloudflare）无 undici，或导入失败：忽略，保持默认直连
  }
})