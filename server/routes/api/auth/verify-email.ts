import { prisma } from '~/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, code } = body

  if (!email || !code) {
    return { success: false, message: '邮箱和验证码不能为空' }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { success: false, message: '用户不存在' }
  }

  // 检查是否超过最大尝试次数
  if (user.emailVerificationAttempts >= 5) {
    return { success: false, message: '验证码尝试次数过多，请重新发送验证码' }
  }

  if (
    user.emailVerificationCode !== code
    || !user.emailVerificationExpires
    || user.emailVerificationExpires < new Date()
  ) {
    // 验证失败：递增尝试次数
    await prisma.user.update({
      where: { email },
      data: { emailVerificationAttempts: { increment: 1 } },
    })
    return { success: false, message: '验证码错误或已过期' }
  }

  await prisma.user.update({
    where: { email },
    data: {
      emailVerified: new Date(),
      emailVerificationCode: null,
      emailVerificationExpires: null,
      emailVerificationAttempts: 0,
    },
  })

  return { success: true, message: '注册成功' }
})
