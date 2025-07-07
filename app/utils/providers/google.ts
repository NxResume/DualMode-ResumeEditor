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
    wellKnown: 'https://accounts.google.com/.well-known/openid-configuration',
    options: config,
  }
}
