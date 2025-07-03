import process from 'node:process'
import { NuxtAuthHandler } from '#auth'
import CredentialsProvider from '@auth/core/providers/credentials'
import GithubProvider from '@auth/core/providers/github'
import GoogleProvider from '@auth/core/providers/google'
import { getAdapter, GiteeProvider } from '~/utils/providers'

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
      authorization: {
        params: {
          prompt: 'consent',
        },
      },
    }),
    GiteeProvider({
      clientId: process.env.GITEE_CLIENT_ID,
      clientSecret: process.env.GITEE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { prisma } = await import('~/utils/db')
        const bcrypt = (await import('bcrypt')).default
        const email = typeof credentials?.email === 'string' ? credentials.email : ''
        const password = typeof credentials?.password === 'string' ? credentials.password : ''
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user)
          throw new Error('用户不存在')
        if (!user.passwordHash)
          throw new Error('该用户未设置密码')
        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid)
          throw new Error('密码错误')
        if (!user.emailVerified)
          throw new Error('邮箱未验证')
        return { id: user.id, email: user.email, name: user.name }
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
  // debug: true,
})
