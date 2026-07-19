import { getServerSession } from '#auth'
import { prisma } from '~/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const session = await getServerSession(event)
    const userEmail = session?.user?.email

    if (!userEmail) {
      return { success: true, data: [] }
    }

    // 一次查询获取简历列表（通过 user 关联避免两次 DB 往返）
    const resumes = await prisma.resume.findMany({
      where: {
        user: { email: userEmail },
      },
      include: {
        settings: true,
      },
      orderBy: { createdAt: 'desc' },
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
