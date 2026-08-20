import { db, schema } from '~/utils/db'

export default defineEventHandler(async (_event) => {
  try {
    // 测试数据库连接：查 users 表计数
    const users = await db.select().from(schema.users).limit(1)
    return { status: 'ok', database: 'connected', users: users.length }
  }
  catch (error: any) {
    throw createError({
      statusCode: 503,
      statusMessage: error?.message || 'Database connection failed',
    })
  }
})
