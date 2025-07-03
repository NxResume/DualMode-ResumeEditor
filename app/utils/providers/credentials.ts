import CredentialsProvider from '@auth/core/providers/credentials'
import bcrypt from 'bcrypt'
import { prisma } from '~/utils/db'

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
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user)
        return null
      if (!user.passwordHash)
        return null
      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid)
        return null
      if (!user.emailVerified)
        return null
      return { id: user.id, email: user.email, name: user.name }
    },
  })
}
