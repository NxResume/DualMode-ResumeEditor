import type { AdapterAccount } from '@auth/core/adapters'
import process from 'node:process'
import { NuxtAuthHandler } from '#auth'
import GithubProvider from '@auth/core/providers/github'
import GoogleProvider from '@auth/core/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '~/utils/db'
import GiteeProvider from '~/utils/providers/gitee'

function getAdapter() {
  const adapter = PrismaAdapter(prisma)

  adapter.linkAccount = async (data) => {
    if (data.provider === 'gitee') {
      const { created_at, ...rest } = data
      return prisma.account.create({ data: rest }) as unknown as AdapterAccount
    }
    return prisma.account.create({ data }) as unknown as AdapterAccount
  }

  return adapter as any
}

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  adapter: getAdapter(),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
        },
      },
    }),
    GiteeProvider({
      clientId: process.env.GITEE_CLIENT_ID,
      clientSecret: process.env.GITEE_CLIENT_SECRET,
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
