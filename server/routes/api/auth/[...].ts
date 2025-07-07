import { randomUUID } from 'node:crypto'
import process from 'node:process'
import { NuxtAuthHandler } from '#auth'
import { encode } from '@auth/core/jwt'
import GithubProvider from '@auth/core/providers/github'
import { CredentialsProvider, getAdapter, GiteeProvider, GoogleProvider } from '~/utils/providers'

const isDev = import.meta.dev
const SESSION_MAX_AGE = 30 * 24 * 60 * 60
export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  adapter: getAdapter(),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GiteeProvider({
      clientId: process.env.GITEE_CLIENT_ID,
      clientSecret: process.env.GITEE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider(),
  ],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/signin',
  },

  jwt: {
    async encode(params: any) {
      return params.token?.sessionId ?? encode(params) as any
    },
  },
  callbacks: {
    // https://github.com/nextauthjs/next-auth/discussions/4394#discussioncomment-8948076
    async jwt({ token, user, account }) {
      if (account?.provider !== 'credentials')
        return token

      const session = await getAdapter().createSession!({
        sessionToken: randomUUID(),
        userId: user.id,
        expires: new Date(Date.now() + SESSION_MAX_AGE * 1000),
      })
      token.sessionId = session.sessionToken
      return token
    },
    session: ({ session, user }) => {
      if (session.user && user?.id) {
        (session.user as any).id = user.id
      }
      return session
    },
  },
  debug: isDev,
})
