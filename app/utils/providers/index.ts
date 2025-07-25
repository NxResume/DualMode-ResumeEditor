import type { AdapterAccount, AdapterUser } from '@auth/core/adapters'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '~/utils/db'
import CredentialsProvider from '~/utils/providers/credentials'
import GiteeProvider from '~/utils/providers/gitee'
import GoogleProvider from '~/utils/providers/google'
import LinuxDoProvider from '~/utils/providers/linuxdo'

function stripUndefined<T>(obj: T) {
  const data = {} as T
  for (const key in obj) {
    if (obj[key] !== undefined)
      data[key] = obj[key]
  }
  return { data }
}

function getAdapter() {
  const adapter = PrismaAdapter(prisma)

  adapter.linkAccount = async (data) => {
    if (data.provider === 'gitee') {
      const { created_at, ...rest } = data
      return prisma.account.create({ data: rest }) as unknown as AdapterAccount
    }
    return prisma.account.create({ data }) as unknown as AdapterAccount
  }

  adapter.createUser = async ({ id, ...data }) => {
    if (data.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
      if (existingUser) {
        return existingUser as AdapterUser
      }
    }

    return prisma.user.create(stripUndefined(data)) as unknown as AdapterUser
  }

  return adapter as any
}

export { CredentialsProvider, getAdapter, GiteeProvider, GoogleProvider, LinuxDoProvider }
