/* eslint-disable no-console */
import CredentialsProvider from '@auth/core/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '~/utils/db'

export default function Credentials() {
  return CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const email = typeof credentials?.email === 'string' ? credentials.email : ''
      const password = typeof credentials?.password === 'string' ? credentials.password : ''
      console.log('[auth-debug] authorize email=', email)
      const user = await (db as any).query.users.findFirst({
        where: (t: { email: any }, { eq }: any) => eq(t.email, email),
      })
      console.log('[auth-debug] user found=', !!user, 'passwordHash?=', !!user?.passwordHash)
      if (!user || !user.passwordHash)
        return null
      const valid = await bcrypt.compare(password, user.passwordHash)
      console.log('[auth-debug] compare=', valid)
      if (!valid)
        return null
      console.log('[auth-debug] emailVerified=', user.emailVerified)
      if (!user.emailVerified) {
        throw new Error('邮箱未验证，请先完成注册验证')
      }
      return { id: user.id, email: user.email, name: user.name }
    },
  })
}
