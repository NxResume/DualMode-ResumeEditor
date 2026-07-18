import type { H3Event } from 'h3'
import { getServerSession } from '#auth'
import { prisma } from '~/utils/db'

/**
 * 获取当前登录用户，未登录或用户不存在时抛出 401
 */
export async function requireCurrentUser(event: H3Event) {
  const session = await getServerSession(event)
  const email = session?.user?.email

  if (!email) {
    throw createError({
      statusCode: 401,
      message: '未登录',
    })
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '用户不存在',
    })
  }

  return user
}

/**
 * 校验简历存在且属于当前登录用户
 * - 缺少 id: 400
 * - 未登录: 401
 * - 简历不存在: 404
 * - 非本人简历: 403
 */
export async function assertResumeOwnership(event: H3Event, id: string | undefined) {
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '简历ID不能为空',
    })
  }

  const user = await requireCurrentUser(event)

  const resume = await prisma.resume.findUnique({
    where: { id },
    select: { id: true, userId: true },
  })

  if (!resume) {
    throw createError({
      statusCode: 404,
      message: '简历不存在',
    })
  }

  if (resume.userId !== user.id) {
    throw createError({
      statusCode: 403,
      message: '无权访问该简历',
    })
  }

  return user
}
