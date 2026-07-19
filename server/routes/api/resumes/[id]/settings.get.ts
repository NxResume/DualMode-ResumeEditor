import { prisma } from '~/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    await assertResumeOwnership(event, id)

    const settings = await prisma.resumeSettings.findUnique({
      where: { resumeId: id },
    })

    return { success: true, data: settings }
  }
  catch (error: any) {
    if (error?.statusCode)
      throw error

    throw createError({
      statusCode: 500,
      message: error?.message || '获取设置失败',
    })
  }
})
