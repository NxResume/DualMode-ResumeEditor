-- D1 建表（从 MySQL/Prisma 迁移，SQLite 方言）
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  emailVerified INTEGER,
  image TEXT,
  passwordHash TEXT,
  emailVerificationCode TEXT,
  emailVerificationExpires INTEGER,
  emailVerificationAttempts INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE (provider, providerAccountId)
);
CREATE INDEX IF NOT EXISTS account_userId_idx ON account (userId);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  sessionToken TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS session_userId_idx ON session (userId);

CREATE TABLE IF NOT EXISTS verificationtoken (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires INTEGER NOT NULL,
  PRIMARY KEY (identifier, token)
);
CREATE UNIQUE INDEX IF NOT EXISTS verificationtoken_token_idx ON verificationtoken (token);

CREATE TABLE IF NOT EXISTS resume (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'default',
  plugins TEXT NOT NULL,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updatedAt INTEGER NOT NULL,
  isDefault INTEGER NOT NULL DEFAULT 0,
  userId TEXT
);
CREATE INDEX IF NOT EXISTS resume_userId_idx ON resume (userId);

CREATE TABLE IF NOT EXISTS resumesettings (
  id TEXT PRIMARY KEY,
  resumeId TEXT NOT NULL UNIQUE,
  fontname TEXT NOT NULL DEFAULT 'default',
  pagePadding INTEGER NOT NULL DEFAULT 36,
  pageLineHeight REAL NOT NULL DEFAULT 1.9,
  pageBackground TEXT NOT NULL DEFAULT 'default',
  pageThemeColor TEXT NOT NULL DEFAULT '0,0,0',
  imagePosition TEXT NOT NULL,
  isScrollable INTEGER NOT NULL DEFAULT 0,
  editorMode TEXT NOT NULL DEFAULT 'source',
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updatedAt INTEGER NOT NULL
);
