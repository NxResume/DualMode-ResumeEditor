import { relations, sql } from 'drizzle-orm'
import {
  customType,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

/**
 * 容错时间戳列（毫秒/秒都认）。
 *
 * 背景：这张表有过一次单位不一致 —— 列默认值是 `unixepoch() * 1000`（毫秒），
 * 但 Drizzle 的 `integer(..., { mode: 'timestamp' })` 读写都按**秒**（读时 ×1000），
 * 于是毫秒值被再乘 1000 → 显示成公元 57521 年。
 *
 * 这里不再依赖单位的"假设"，而是按数量级判断：小于 1e11 的是秒，其余是毫秒。
 * 写入统一用毫秒（与表默认值一致），所以新老数据都自洽，不需要数据迁移。
 */
const stamp = customType<{ data: Date, driverData: number }>({
  dataType() {
    return 'integer'
  },
  fromDriver(value) {
    const n = Number(value)
    if (!Number.isFinite(n))
      return new Date(Number.NaN)
    return new Date(n < 1e11 ? n * 1000 : n)
  },
  toDriver(value) {
    return value.getTime()
  },
})

// Auth.js DrizzleAdapter 插入 session/account 时不传 id，依赖列的
// $defaultFn 自动生成（与 Prisma 的 @default(cuid()) 等价）
const idDefault = () => crypto.randomUUID()

// ============================================================
// D1（Cloudflare SQLite）表结构 —— 从 MySQL 迁移而来
// 表名/列名与旧库一致（Prisma 单数表名），日期用 timestamp 模式存 Date
// ============================================================

export const users = sqliteTable(
  'user',
  {
    id: text('id').primaryKey().$defaultFn(idDefault),
    name: text('name'),
    email: text('email'),
    emailVerified: integer('emailVerified', { mode: 'timestamp' }),
    image: text('image'),
    passwordHash: text('passwordHash'),
    emailVerificationCode: text('emailVerificationCode'),
    emailVerificationExpires: integer('emailVerificationExpires', { mode: 'timestamp' }),
    emailVerificationAttempts: integer('emailVerificationAttempts').notNull().default(0),
  },
  t => [
    uniqueIndex('User_email_key').on(t.email),
  ],
)

export const accounts = sqliteTable(
  'account',
  {
    id: text('id').primaryKey().$defaultFn(idDefault),
    userId: text('userId').notNull(),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
  },
  t => [
    uniqueIndex('Account_provider_providerAccountId_key').on(t.provider, t.providerAccountId),
    index('Account_userId_fkey').on(t.userId),
  ],
)

export const sessions = sqliteTable(
  'session',
  {
    id: text('id').primaryKey().$defaultFn(idDefault),
    sessionToken: text('sessionToken').notNull(),
    userId: text('userId').notNull(),
    expires: integer('expires', { mode: 'timestamp' }).notNull(),
  },
  t => [
    uniqueIndex('Session_sessionToken_key').on(t.sessionToken),
    index('Session_userId_fkey').on(t.userId),
  ],
)

export const verificationTokens = sqliteTable(
  'verificationtoken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: integer('expires', { mode: 'timestamp' }).notNull(),
  },
  t => [
    uniqueIndex('VerificationToken_token_key').on(t.token),
    uniqueIndex('VerificationToken_identifier_token_key').on(t.identifier, t.token),
    primaryKey({ columns: [t.identifier, t.token] }),
  ],
)

export const resumes = sqliteTable(
  'resume',
  {
    id: text('id').primaryKey().$defaultFn(idDefault),
    name: text('name').notNull(),
    content: text('content').notNull(),
    theme: text('theme').notNull().default('default'),
    plugins: text('plugins').notNull(),
    createdAt: stamp('createdAt').notNull().default(sql`(unixepoch() * 1000)`),
    updatedAt: stamp('updatedAt').notNull(),
    isDefault: integer('isDefault').notNull().default(0),
    userId: text('userId'),
  },
  t => [
    index('Resume_userId_fkey').on(t.userId),
  ],
)

export const resumeSettings = sqliteTable(
  'resumesettings',
  {
    id: text('id').primaryKey().$defaultFn(idDefault),
    resumeId: text('resumeId').notNull(),
    fontname: text('fontname').notNull().default('default'),
    pagePadding: integer('pagePadding').notNull().default(36),
    pageLineHeight: real('pageLineHeight').notNull().default(1.9),
    pageBackground: text('pageBackground').notNull().default('default'),
    // '0,0,0' 是历史默认值，语义等同 isFollowingThemeColor 的「跟随主题」（与主题包兜底色一致）
    pageThemeColor: text('pageThemeColor').notNull().default('0,0,0'),
    imagePosition: text('imagePosition').notNull(),
    isScrollable: integer('isScrollable').notNull().default(0),
    editorMode: text('editorMode').notNull().default('source'),
    createdAt: stamp('createdAt').notNull().default(sql`(unixepoch() * 1000)`),
    updatedAt: stamp('updatedAt').notNull(),
  },
  t => [
    uniqueIndex('ResumeSettings_resumeId_key').on(t.resumeId),
  ],
)

// 证件照上传日志：既是防滥用的速率限制依据（按 actor 计数），
// 也是审计表（谁/哪个 IP 在什么时候传了什么图）
export const photoUploads = sqliteTable(
  'photoupload',
  {
    id: text('id').primaryKey().$defaultFn(idDefault),
    // R2 object key（uuid + 扩展名）
    objectKey: text('objectKey').notNull(),
    // 登录用户 = email；匿名 = ip:xxx
    actor: text('actor').notNull(),
    bytes: integer('bytes').notNull(),
    createdAt: stamp('createdAt').notNull().default(sql`(unixepoch() * 1000)`),
  },
  t => [
    index('PhotoUpload_actor_createdAt_idx').on(t.actor, t.createdAt),
  ],
)

// ---------- relations ----------

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  resumes: many(resumes),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const resumesRelations = relations(resumes, ({ one }) => ({
  user: one(users, { fields: [resumes.userId], references: [users.id] }),
  settings: one(resumeSettings, { fields: [resumes.id], references: [resumeSettings.resumeId] }),
}))

export const resumeSettingsRelations = relations(resumeSettings, ({ one }) => ({
  resume: one(resumes, { fields: [resumeSettings.resumeId], references: [resumes.id] }),
}))

export type User = typeof users.$inferSelect
export type Resume = typeof resumes.$inferSelect
export type ResumeSettings = typeof resumeSettings.$inferSelect
