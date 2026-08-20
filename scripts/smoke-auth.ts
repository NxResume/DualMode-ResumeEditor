// 验证 Auth.js DrizzleAdapter 的 session 插入（$defaultFn 生效）
// 仅本地运行，process 是全局对象
/* eslint-disable node/prefer-global/process */
import { eq } from 'drizzle-orm'
import { db, schema } from '../app/utils/db'
import 'dotenv/config'

async function main() {
  console.log('=== 1. 直接插入 session（模拟 DrizzleAdapter createSession）===')
  try {
    const sessionToken = `test-${Date.now()}`
    await db.insert(schema.sessions).values({
      sessionToken,
      userId: 'cmd0knsgj0006xzgbl2g2znx9', // 现有用户
      expires: new Date(Date.now() + 3600_000),
    })
    console.log('✅ session 插入成功（id 自动生成）')

    // 验证 id 已生成
    const s = await db.query.sessions.findFirst({
      where: (t, { eq }) => eq(t.sessionToken, sessionToken),
    })
    console.log('  生成的 id:', s?.id, '| sessionToken:', s?.sessionToken)

    // 清理测试数据
    await db.delete(schema.sessions).where(
      eq(schema.sessions.sessionToken, sessionToken),
    )
    console.log('✅ 测试数据已清理')
  }
  catch (e: any) {
    console.error('❌ session 插入失败:', e.message)

    process.exit(1)
  }

  console.log('\n=== 2. 直接插入 account（模拟 DrizzleAdapter linkAccount）===')
  try {
    const id = `acct-test-${Date.now()}`
    await db.insert(schema.accounts).values({
      id,
      userId: 'cmd0knsgj0006xzgbl2g2znx9',
      type: 'credentials',
      provider: 'test',
      providerAccountId: `test-${Date.now()}`,
    })
    console.log('✅ account 插入成功')
    await db.delete(schema.accounts).where(eq(schema.accounts.id, id))
    console.log('✅ 测试数据已清理')
  }
  catch (e: any) {
    console.error('❌ account 插入失败:', e.message)
    process.exit(1)
  }

  console.log('\n✅ 全部通过')
  process.exit(0)
}

main()
