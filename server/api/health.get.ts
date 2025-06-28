import { prisma } from '../utils/db'

export default defineEventHandler(async (_event) => {
  try {
    // 测试数据库连接
    await prisma.$queryRaw`SELECT 1`
    return { status: 'ok', database: 'connected' }
  }
  catch (error: any) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Database connection failed',
    })
  }
})
