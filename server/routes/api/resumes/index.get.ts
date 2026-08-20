import { getServerSession } from '#auth'
import { desc } from 'drizzle-orm'
import { db, schema } from '~/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const session = await getServerSession(event)
    const userEmail = session?.user?.email

    if (!userEmail) {
      return { success: true, data: [] }
    }

    // 先找 user（通过 email），再查其简历列表（带 settings 关联）
    const user = await db.query.users.findFirst({
      where: (t, { eq }) => eq(t.email, userEmail),
    })

    if (!user) {
      return { success: true, data: [] }
    }

    const resumes = await db.query.resumes.findMany({
      where: (t, { eq }) => eq(t.userId, user.id),
      with: {
        settings: true,
      },
      orderBy: [desc(schema.resumes.createdAt)],
    })

    return {
      success: true,
      data: resumes,
    }
  }
  catch (error: any) {
    console.error('Error fetching resumes:', error)
    throw createError({
      statusCode: 500,
      message: error?.message || '获取简历列表失败',
    })
  }
})
