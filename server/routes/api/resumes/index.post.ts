import { getServerSession } from '#auth'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const session = await getServerSession(event)
    const userEmail = session?.user?.email

    if (!userEmail) {
      throw createError({
        statusCode: 401,
        statusMessage: '未登录',
      })
    }

    // 根据邮箱查找用户
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: '用户不存在',
      })
    }

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
    throw createError({
      statusCode: 500,
      statusMessage: error.message || '创建简历失败',
    })
  }
})
