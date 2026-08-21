import { defineConfig } from 'drizzle-kit'

// drizzle-kit 面向「本地 SQLite」开发（generate / push / studio）。
// 生产 D1 走 wrangler d1 命令（见 package.json 的 db:d1:execute / db:d1:apply）。
// schema 是 sqlite 方言，生成的迁移对 D1 完全兼容。
export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    // 与 app/utils/db.ts 里本地 better-sqlite3 的文件路径保持一致
    url: './.data/resume.db',
  },
})
