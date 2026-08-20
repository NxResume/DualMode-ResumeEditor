import { relations, sql } from 'drizzle-orm'
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

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
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
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
    pageThemeColor: text('pageThemeColor').notNull().default('0,0,0'),
    imagePosition: text('imagePosition').notNull(),
    isScrollable: integer('isScrollable').notNull().default(0),
    editorMode: text('editorMode').notNull().default('source'),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  },
  t => [
    uniqueIndex('ResumeSettings_resumeId_key').on(t.resumeId),
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
