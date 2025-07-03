import process from 'node:process'
import bcrypt from 'bcrypt'
import nodemailer from 'nodemailer'
import { prisma } from '~/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    return { success: false, message: '邮箱和密码不能为空' }
  }

  // 检查邮箱是否已注册
  const exist = await prisma.user.findUnique({ where: { email } })
  if (exist) {
    return { success: false, message: '邮箱已注册' }
  }

  // 生成5位数字验证码
  const code = Math.floor(10000 + Math.random() * 90000).toString()
  const expires = new Date(Date.now() + 5 * 60 * 1000) // 5分钟

  // 密码加密
  const passwordHash = await bcrypt.hash(password, 10)

  // 创建用户
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      emailVerificationCode: code,
      emailVerificationExpires: expires,
    },
  })

  // 发送邮件（邮箱和授权码请在 .env 文件中配置）
  const transporter = nodemailer.createTransport({
    service: 'qq', // 如用qq/163请改为对应服务
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  })

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: '你的注册验证码',
    text: `5分钟内有效，您的验证码是：${code}`,
  })

  return { success: true, message: '验证码已发送到邮箱' }
})
