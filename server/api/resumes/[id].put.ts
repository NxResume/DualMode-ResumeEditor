import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    const resume = await prisma.resume.update({
      where: { id },
      data: {
        name: body.name,
        content: body.content,
        theme: body.theme,
        plugins: JSON.stringify(body.plugins || []),
        updatedAt: new Date(),
      },
      include: {
        settings: true,
      },
    })

    return {
      success: true,
      data: resume,
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error || '更新简历失败',
    })
  }
})
