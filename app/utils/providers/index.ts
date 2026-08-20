import type { AdapterAccount, AdapterUser } from '@auth/core/adapters'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db, schema } from '~/utils/db'
import CredentialsProvider from '~/utils/providers/credentials'
import GiteeProvider from '~/utils/providers/gitee'
import GoogleProvider from '~/utils/providers/google'
import LinuxDoProvider from '~/utils/providers/linuxdo'

function getAdapter() {
  // DrizzleAdapter 的类型定义期望 timestamp 列（我们线上表是 datetime(3)），
  // 运行时 adapter 仅按列名取值，类型差异无影响 —— 用类型断言绕过编译期检查
  const adapter = DrizzleAdapter(db as any, {
    usersTable: schema.users as any,
    accountsTable: schema.accounts as any,
    sessionsTable: schema.sessions as any,
    verificationTokensTable: schema.verificationTokens as any,
  } as any)

  adapter.linkAccount = async (data: any) => {
    if (data.provider === 'gitee') {
      const { created_at, ...rest } = data
      return db.insert(schema.accounts).values(rest) as unknown as AdapterAccount
    }
    return db.insert(schema.accounts).values(data) as unknown as AdapterAccount
  }

  adapter.createUser = async ({ id, ...data }: any) => {
    if (data.email) {
      const existingUser = await db.query.users.findFirst({
        where: (t, { eq }) => eq(t.email, data.email),
      })
      if (existingUser) {
        return existingUser as AdapterUser
      }
    }

    return db.insert(schema.users).values(data) as unknown as AdapterUser
  }

  return adapter as any
}

export { CredentialsProvider, getAdapter, GiteeProvider, GoogleProvider, LinuxDoProvider }
