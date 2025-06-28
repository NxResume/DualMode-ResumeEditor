import { prisma } from '../../utils/db'

export default defineEventHandler(async (_event) => {
  try {
    const resumes = await prisma.resume.findMany({
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
    throw createError({
      statusCode: 500,
      statusMessage: error || '获取简历列表失败',
    })
  }
})
