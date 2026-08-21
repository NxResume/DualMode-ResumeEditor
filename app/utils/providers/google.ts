export default function Google(
  config: any,
): any {
  return {
    id: 'google',
    name: 'Google',
    type: 'oauth',
    authorization: {
      url: 'https://accounts.google.com/o/oauth2/v2/auth',
      params: {
        scope: 'openid email profile',
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
      },
    },
    token: {
      url: 'https://oauth2.googleapis.com/token',
      params: {
        grant_type: 'authorization_code',
      },
    },
    userinfo: {
      url: 'https://openidconnect.googleapis.com/v1/userinfo',
      async request({ tokens, provider }: any) {
        const profile = await fetch(provider.userinfo?.url as URL, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'User-Agent': 'authjs',
          },
        }).then(async res => await res.json())

        // Google always returns email as verified, so no need for extra fetch here
        return profile
      },
    },
    profile(profile: any) {
      return {
        id: profile.sub ?? profile.id,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
      }
    },
    issuer: 'https://accounts.google.com',
    // Google 返回 id_token，next-auth 的 oauth callback 需用 JWKS 校验其签名。
    // 因未配 wellKnown（Issuer.discover 在 workerd 下不兼容），需显式提供 jwks_endpoint
    // 供 openid-client 构建 Issuer 时使用（next-auth 将其映射为 jwks_uri）。
    jwks_endpoint: 'https://www.googleapis.com/oauth2/v3/certs',
    // 注意：不要配 wellKnown —— openid-client 的 Issuer.discover（url.parse + oauth4webapi
    // request）在 Cloudflare workerd 下不兼容，报 "only valid absolute URLs can be requested"。
    // 上面 authorization/token/userinfo URL 已完整，走显式 endpoint 路径（与 gitee/linuxdo 一致）。
    options: config,
  }
}
