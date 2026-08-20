// 数据层冒烟测试：本地 SQLite（better-sqlite3），验证 Drizzle 查询与 schema 对齐
// 仅本地运行，process 是全局对象
/* eslint-disable node/prefer-global/process */
import { desc, sql } from 'drizzle-orm'
import { db, schema } from '../app/utils/db'
import 'dotenv/config'

async function main() {
  console.log('=== 1. 查用户（前 3 个）===')
  const users = await db.select().from(schema.users).limit(3)
  console.log(`users: ${users.length}`, users.map(u => ({ id: u.id, email: u.email })))

  console.log('\n=== 2. 查简历（前 3 个，带 settings 关联）===')
  const resumes = await db.query.resumes.findMany({
    with: { settings: true },
    orderBy: [desc(schema.resumes.createdAt)],
    limit: 3,
  })
  console.log(`resumes: ${resumes.length}`, resumes.map(r => ({ id: r.id, name: r.name, hasSettings: !!r.settings })))

  console.log('\n=== 3. SELECT 1（连接健康）===')
  const row = await db.get(sql`SELECT 1 AS ok`)
  console.log('SELECT 1:', row)

  console.log('\n=== 4. account 查询（验证 auth 表）===')
  const accounts = await db.select().from(schema.accounts).limit(2)
  console.log(`accounts: ${accounts.length}`, accounts.map(a => ({ provider: a.provider, accountId: a.providerAccountId })))

  console.log('\n=== 5. verificationtoken 表存在性 ===')
  const vt = await db.select().from(schema.verificationTokens).limit(1)
  console.log(`verificationTokens rows: ${vt.length}`)

  console.log('\n✅ 冒烟测试全部通过')
  process.exit(0)
}

main().catch((e) => {
  console.error('❌ 冒烟测试失败:', e)
  process.exit(1)
})
