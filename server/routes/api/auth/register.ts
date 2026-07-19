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

  // 检查邮箱是否已注册（仅已完成验证的账号视为已注册）
  const exist = await prisma.user.findUnique({ where: { email } })
  if (exist?.emailVerified) {
    return { success: false, message: '邮箱已注册' }
  }

  // 冷却检查：60 秒内不允许重复发送验证码
  if (exist?.emailVerificationExpires) {
    const cooldownRemaining = exist.emailVerificationExpires.getTime() - Date.now() - 4 * 60 * 1000
    if (cooldownRemaining > 0) {
      const seconds = Math.ceil(cooldownRemaining / 1000)
      return { success: false, message: `请${seconds}秒后再发送验证码` }
    }
  }

  // 生成5位数字验证码
  const code = Math.floor(10000 + Math.random() * 90000).toString()
  const expires = new Date(Date.now() + 5 * 60 * 1000) // 5分钟

  // 密码加密
  const passwordHash = await bcrypt.hash(password, 10)

  // 已存在但未验证的用户：更新验证码并重发（支持重新发送/过期重试）
  // 不存在则创建新用户
  const user = exist
    ? await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          emailVerificationCode: code,
          emailVerificationExpires: expires,
          emailVerificationAttempts: 0,
        },
      })
    : await prisma.user.create({
        data: {
          email,
          passwordHash,
          emailVerificationCode: code,
          emailVerificationExpires: expires,
        },
      })

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: 'credentials',
        providerAccountId: email,
      },
    },
    update: {},
    create: {
      userId: user.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: email,
    },
  })

  // 发送邮件（邮箱和授权码请在 .env 文件中配置）
  try {
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
  }
  catch (error) {
    // 邮件发送失败不应留下不可恢复的状态：
    // 用户仍处于未验证状态，下次点击“发送验证码”会重新生成并发送
    console.error('发送验证码邮件失败:', error)
    return { success: false, message: '验证码邮件发送失败，请稍后重试' }
  }

  return { success: true, message: '验证码已发送到邮箱' }
})
