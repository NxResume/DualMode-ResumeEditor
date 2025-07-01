import { getServerSession } from '#auth'
import { prisma } from '~/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // 获取当前用户会话
    const session = await getServerSession(event)
    const userEmail = session?.user?.email

    // 如果没有登录或没有邮箱，返回空数组
    if (!userEmail) {
      return {
        success: true,
        data: [],
      }
    }

    // 根据邮箱查找用户
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    })

    if (!user) {
      return {
        success: true,
        data: [],
      }
    }

    const resumes = await prisma.resume.findMany({
      where: {
        userId: user.id,
      },
      include: {
        settings: false,
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
      statusMessage: error.message || '获取简历列表失败',
    })
  }
})
