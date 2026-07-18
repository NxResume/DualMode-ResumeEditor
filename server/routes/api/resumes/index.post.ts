import { prisma } from '~/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCurrentUser(event)

    const body = await readBody(event)
    const { name, content, theme, plugins, isDefault } = body

    const resume = await prisma.resume.create({
      data: {
        name,
        content,
        theme,
        plugins: JSON.stringify(plugins || []),
        isDefault: isDefault || false,
        userId: user.id,
      } as any,
    })

    return {
      success: true,
      data: resume,
    }
  }
  catch (error: any) {
    console.error('Error creating resume:', error)

    if (error?.statusCode)
      throw error

    throw createError({
      statusCode: 500,
      message: error?.message || '创建简历失败',
    })
  }
})
