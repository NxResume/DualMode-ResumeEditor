import { sql } from 'drizzle-orm'
import { db } from '~/utils/db'

export default defineEventHandler(async (_event) => {
  try {
    // 测试数据库连接
    await db.execute(sql`SELECT 1`)
    return { status: 'ok', database: 'connected' }
  }
  catch (error: any) {
    throw createError({
      statusCode: 503,
      statusMessage: error?.message || 'Database connection failed',
    })
  }
})
