import process from 'node:process'
import { NuxtAuthHandler } from '#auth'
import GithubProvider from '@auth/core/providers/github'
import GoogleProvider from '@auth/core/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '../../../utils/db'

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // @ts-expect-error Use .default here for it to work during SSR.
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    // @ts-expect-error Use .default here for it to work during SSR.
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
        },
      },
    }),
  ],
  session: {
    strategy: 'database', // 改为数据库策略
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    session: ({ session, user }) => {
      if (session.user) {
        (session.user as unknown as any).id = user.id
      }
      return session
    },
  },
  debug: true,
})
