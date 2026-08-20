import { relations, sql } from 'drizzle-orm'
import {
  datetime,
  double,
  index,
  int,
  mysqlTable,
  primaryKey,
  text,
  tinyint,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core'

// ============================================================
// 与现有 MySQL 表结构严格对齐（原 Prisma 迁移生成的表）
// 表名/列名/类型/索引必须与 SHOW CREATE TABLE 完全一致，
// 不要在这里改结构 —— 否则与线上数据不匹配
// ============================================================

export const users = mysqlTable(
  'user',
  {
    id: varchar('id', { length: 191 }).primaryKey(),
    name: varchar('name', { length: 191 }),
    email: varchar('email', { length: 191 }),
    emailVerified: datetime('emailVerified', { mode: 'date', fsp: 3 }),
    image: varchar('image', { length: 191 }),
    passwordHash: varchar('passwordHash', { length: 191 }),
    emailVerificationCode: varchar('emailVerificationCode', { length: 191 }),
    emailVerificationExpires: datetime('emailVerificationExpires', { mode: 'date', fsp: 3 }),
    emailVerificationAttempts: int('emailVerificationAttempts').notNull().default(0),
  },
  t => [
    uniqueIndex('User_email_key').on(t.email),
  ],
)

export const accounts = mysqlTable(
  'account',
  {
    id: varchar('id', { length: 191 }).primaryKey(),
    userId: varchar('userId', { length: 191 }).notNull(),
    type: varchar('type', { length: 191 }).notNull(),
    provider: varchar('provider', { length: 191 }).notNull(),
    providerAccountId: varchar('providerAccountId', { length: 191 }).notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: int('expires_at'),
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

export const sessions = mysqlTable(
  'session',
  {
    id: varchar('id', { length: 191 }).primaryKey(),
    sessionToken: varchar('sessionToken', { length: 191 }).notNull(),
    userId: varchar('userId', { length: 191 }).notNull(),
    expires: datetime('expires', { mode: 'date', fsp: 3 }).notNull(),
  },
  t => [
    uniqueIndex('Session_sessionToken_key').on(t.sessionToken),
    index('Session_userId_fkey').on(t.userId),
  ],
)

export const verificationTokens = mysqlTable(
  'verificationtoken',
  {
    identifier: varchar('identifier', { length: 191 }).notNull(),
    token: varchar('token', { length: 191 }).notNull(),
    expires: datetime('expires', { mode: 'date', fsp: 3 }).notNull(),
  },
  t => [
    uniqueIndex('VerificationToken_token_key').on(t.token),
    uniqueIndex('VerificationToken_identifier_token_key').on(t.identifier, t.token),
    primaryKey({ columns: [t.identifier, t.token] }),
  ],
)

export const resumes = mysqlTable(
  'resume',
  {
    id: varchar('id', { length: 191 }).primaryKey(),
    name: varchar('name', { length: 191 }).notNull(),
    content: text('content').notNull(),
    theme: varchar('theme', { length: 191 }).notNull().default('default'),
    plugins: text('plugins').notNull(),
    createdAt: datetime('createdAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime('updatedAt', { mode: 'date', fsp: 3 }).notNull(),
    isDefault: tinyint('isDefault').notNull().default(0),
    userId: varchar('userId', { length: 191 }),
  },
  t => [
    index('Resume_userId_fkey').on(t.userId),
  ],
)

export const resumeSettings = mysqlTable(
  'resumesettings',
  {
    id: varchar('id', { length: 191 }).primaryKey(),
    resumeId: varchar('resumeId', { length: 191 }).notNull(),
    fontname: varchar('fontname', { length: 191 }).notNull().default('default'),
    pagePadding: int('pagePadding').notNull().default(36),
    pageLineHeight: double('pageLineHeight').notNull().default(1.9),
    pageBackground: varchar('pageBackground', { length: 191 }).notNull().default('default'),
    pageThemeColor: varchar('pageThemeColor', { length: 191 }).notNull().default('0,0,0'),
    imagePosition: text('imagePosition').notNull(),
    isScrollable: tinyint('isScrollable').notNull().default(0),
    editorMode: varchar('editorMode', { length: 191 }).notNull().default('source'),
    createdAt: datetime('createdAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime('updatedAt', { mode: 'date', fsp: 3 }).notNull(),
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
