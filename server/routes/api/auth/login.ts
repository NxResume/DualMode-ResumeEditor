import { randomBytes } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    return { success: false, message: '邮箱和密码不能为空' }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { success: false, message: '用户不存在' }
  }

  if (!user.passwordHash) {
    return { success: false, message: '该用户未设置密码' }
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return { success: false, message: '密码错误' }
  }

  if (!user.emailVerified) {
    return { success: false, message: '邮箱未验证' }
  }

  // 生成随机 token
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7天

  // 存入 verificationToken 表
  await prisma.verificationToken.create({
    data: {
      identifier: user.email!,
      token,
      expires,
    },
  })

  // 设置 cookie, 并且保存到数据库
  await prisma.session.create({
    data: {
      sessionToken: token,
      userId: user.id,
      expires,
    },
  })

  setCookie(event, 'next-auth.session-token', token, {
    httpOnly: true,
    secure: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/',
  })

  // 返回 token 给前端
  return {
    success: true,
    message: '登录成功',
    token,
    user: { id: user.id, email: user.email, name: user.name },
  }
})
