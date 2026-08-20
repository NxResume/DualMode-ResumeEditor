// 初始化本地 SQLite 数据库（供 `pnpm dev` 本地开发使用）
// 用法：node scripts/init-local-db.mjs
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dbPath = join(root, '.data', 'resume.db')

mkdirSync(dirname(dbPath), { recursive: true })
const db = new Database(dbPath)

// 建表
db.exec(readFileSync(join(root, 'migrations', 'd1.sql'), 'utf8'))
// 导数据（若文件存在）
try {
  const data = readFileSync(join(root, 'migrations', 'data.clean.sql'), 'utf8')
  db.exec(data)
}
catch {
  // data.clean.sql 不存在则跳过（空库）
}

const count = db.prepare('SELECT COUNT(*) c FROM user').get()
console.log(`✅ 本地数据库初始化完成: ${dbPath} (user=${count.c})`)
db.close()
