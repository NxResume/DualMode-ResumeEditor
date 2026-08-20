import { eq } from 'drizzle-orm'
import { db, schema } from '~/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    await assertResumeOwnership(event, id)

    await db.delete(schema.resumes).where(eq(schema.resumes.id, id!))

    return {
      success: true,
      message: '删除成功',
    }
  }
  catch (error: any) {
    if (error?.statusCode)
      throw error

    throw createError({
      statusCode: 500,
      message: error?.message || '删除简历失败',
    })
  }
})
