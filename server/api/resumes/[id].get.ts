import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const resume = await prisma.resume.findUnique({
      where: { id },
      include: {
        settings: true,
      },
    })

    if (!resume) {
      throw createError({
        statusCode: 404,
        statusMessage: '简历不存在',
      })
    }

    return {
      success: true,
      data: resume,
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error || '获取简历失败',
    })
  }
})
