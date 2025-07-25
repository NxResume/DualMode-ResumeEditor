export default function LinuxDo(
  config: any,
): any {
  return {
    id: 'linuxdo',
    name: 'Linux.do',
    type: 'oauth',
    authorization: {
      url: 'https://connect.linux.do/oauth2/authorize',
      params: {
        scope: 'user:email',
        response_type: 'code',
      },
    },
    token: {
      url: 'https://connect.linux.do/oauth2/token',
      params: {
        grant_type: 'authorization_code',
      },
    },
    userinfo: {
      url: 'https://connect.linux.do/api/user',
      async request({ tokens, provider }: any) {
        const profile = await fetch(provider.userinfo?.url as URL, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'User-Agent': 'authjs',
          },
        }).then(async res => await res.json())

        return profile
      },
    },
    profile(profile: any) {
      return {
        id: profile.id.toString(),
        name: profile.name || profile.username,
        email: profile.email,
        image: profile.avatar_url,
      }
    },
    options: config,
  }
}
