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

  if (
    user.emailVerificationCode !== code
    || !user.emailVerificationExpires
    || user.emailVerificationExpires < new Date()
  ) {
    return { success: false, message: '验证码错误或已过期' }
  }

  await prisma.user.update({
    where: { email },
    data: {
      emailVerified: new Date(),
      emailVerificationCode: null,
      emailVerificationExpires: null,
    },
  })

  return { success: true, message: '注册成功' }
})
