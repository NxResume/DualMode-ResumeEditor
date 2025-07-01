function GiteeProvider(options: any) {
  return {
    id: 'gitee',
    name: 'Gitee',
    type: 'oauth',
    authorization: 'https://gitee.com/oauth/authorize?scope=user_info',
    token: 'https://gitee.com/oauth/token',
    userinfo: 'https://gitee.com/api/v5/user',
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    profile(profile: any) {
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        image: profile.avatar_url,
      }
    },
  }
}

export { GiteeProvider }
