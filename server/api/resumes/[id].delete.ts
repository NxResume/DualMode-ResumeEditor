import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    await prisma.resume.delete({
      where: { id },
    })

    return {
      success: true,
      message: '删除成功',
    }
  }
  catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '删除简历失败',
    })
  }
})
