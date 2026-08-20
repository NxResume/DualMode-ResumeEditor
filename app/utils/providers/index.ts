import type { AdapterAccount, AdapterUser } from '@auth/core/adapters'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { getDb, schema } from '~/utils/db'
import CredentialsProvider from '~/utils/providers/credentials'
import GiteeProvider from '~/utils/providers/gitee'
import GoogleProvider from '~/utils/providers/google'
import LinuxDoProvider from '~/utils/providers/linuxdo'

function getAdapter() {
  // 必须传真实实例（getDb()）而非 Proxy：DrizzleAdapter 用 instanceof 检测数据库类型
  const realDb = getDb() as any
  // DrizzleAdapter 的类型定义期望 timestamp 列，运行时 adapter 仅按列名取值，
  // 类型差异无影响 —— 用类型断言绕过编译期检查
  const adapter = DrizzleAdapter(realDb, {
    usersTable: schema.users as any,
    accountsTable: schema.accounts as any,
    sessionsTable: schema.sessions as any,
    verificationTokensTable: schema.verificationTokens as any,
  } as any)

  adapter.linkAccount = async (data: any) => {
    if (data.provider === 'gitee') {
      const { created_at, ...rest } = data
      return realDb.insert(schema.accounts).values(rest) as unknown as AdapterAccount
    }
    return realDb.insert(schema.accounts).values(data) as unknown as AdapterAccount
  }

  adapter.createUser = async ({ id, ...data }: any) => {
    if (data.email) {
      const existingUser = await realDb.query.users.findFirst({
        where: (t: any, { eq }: any) => eq(t.email, data.email),
      })
      if (existingUser) {
        return existingUser as AdapterUser
      }
    }

    return realDb.insert(schema.users).values(data) as unknown as AdapterUser
  }

  return adapter as any
}

export { CredentialsProvider, getAdapter, GiteeProvider, GoogleProvider, LinuxDoProvider }
