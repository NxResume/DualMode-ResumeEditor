import { prisma } from '~/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    await assertResumeOwnership(event, id)

    const resume = await prisma.resume.findUnique({
      where: { id },
      include: {
        settings: true,
      },
    })

    if (!resume) {
      throw createError({
        statusCode: 404,
        message: '简历不存在',
      })
    }

    return {
      success: true,
      data: resume,
    }
  }
  catch (error: any) {
    // 已带状态码的错误（401/403/404 等）直接透传，避免被包装成 500
    if (error?.statusCode)
      throw error

    throw createError({
      statusCode: 500,
      message: error?.message || '获取简历失败',
    })
  }
})
