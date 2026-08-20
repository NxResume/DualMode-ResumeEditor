// 该文件同时运行在 Node 与 Workers（edge）环境：Workers 上 process 是全局
// polyfill，不能 require("process")，故禁用 prefer-global/process 检查
/* eslint-disable node/prefer-global/process */
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import Database from 'better-sqlite3'
import { drizzle as drizzleLite } from 'drizzle-orm/better-sqlite3'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../../db/schema'

type AnyDb = DrizzleD1Database<typeof schema> | BaseSQLiteDatabase<'sync', any, typeof schema>

const globalForDb = globalThis as unknown as {
  __resumeDb: AnyDb | undefined
  __resumeConn: any
}

/**
 * 按运行时选择数据库连接方式：
 *
 *   - Cloudflare Workers / Pages Functions：
 *       D1 绑定 env.DB（原生 HTTP 协议，无 TCP/mysql2/Hyperdrive 兼容问题）
 *
 *   - Node（本地 dev / node-server 部署）：
 *       better-sqlite3 连本地 SQLite 文件 .data/resume.db
 *
 * 注意：
 *   1) D1 是 SQLite 方言，schema 见 db/schema.ts（sqlite-core）
 *   2) 为了不破坏现有 `import { db } from '~/utils/db'` 的使用方式，
 *      这里用 Proxy 做延迟初始化：第一次访问 db 的任意属性时才真正创建
 *      Drizzle 实例，避免 import 阶段 Nitro useRuntimeConfig 尚未就绪。
 */

/**
 * Nitro 在 Pages Functions 里会把 Pages env 放到 process.env；
 * 不同版本有时会漏同步，这里兜底从 useRuntimeConfig().nitro.cloudflare.env 里再读一次。
 */
function getEnvWithBindings(): Record<string, any> {
  const env: Record<string, any> = { ...process.env }

  if (!env.DB) {
    try {
      let rt: any = (globalThis as any).__NUXT_RUNTIME_CONFIG__
      if (!rt && typeof useRuntimeConfig === 'function')
        rt = useRuntimeConfig()

      const nitroCloudflareEnv = rt?.nitro?.cloudflare?.env
      if (nitroCloudflareEnv?.DB)
        env.DB = nitroCloudflareEnv.DB

      // sidebase-auth / oauth secrets 也顺带兜底（Dashboard 里常和 DB 一起配）
      for (const k of [
        'AUTH_SECRET',
        'AUTH_ORIGIN',
        'GITHUB_CLIENT_ID',
        'GITHUB_CLIENT_SECRET',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GITEE_CLIENT_ID',
        'GITEE_CLIENT_SECRET',
        'LINUXDO_CLIENT_ID',
        'LINUXDO_CLIENT_SECRET',
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASS',
      ]) {
        if (nitroCloudflareEnv?.[k] != null)
          env[k] = nitroCloudflareEnv[k]
      }
    }
    catch {}
  }

  return env
}

function createDrizzle(): AnyDb {
  const env = getEnvWithBindings()

  // Workers / Pages Functions：D1 绑定
  if (env.DB && typeof env.DB === 'object' && 'prepare' in env.DB) {
    const d1 = env.DB
    globalForDb.__resumeConn = d1
    return drizzle(d1, { schema })
  }

  // Node：better-sqlite3 本地文件
  const sqlite = new Database('.data/resume.db')
  sqlite.pragma('journal_mode = WAL')
  globalForDb.__resumeConn = sqlite
  return drizzleLite(sqlite, { schema })
}

// 延迟初始化单例
let lazyDb: AnyDb | undefined = globalForDb.__resumeDb

export function getDb(): AnyDb {
  if (!lazyDb) {
    lazyDb = createDrizzle()
    if (!globalForDb.__resumeDb)
      globalForDb.__resumeDb = lazyDb
  }
  return lazyDb
}

/**
 * 向后兼容：保持 `import { db } from '~/utils/db'` 的写法不变
 *
 * 用 Proxy 实现延迟：第一次真正访问 db.resume / db.select 等属性时
 * 才会创建 Drizzle 实例，避免 import 阶段读 runtime。
 */
export const db = new Proxy(
  {} as AnyDb,
  {
    get(_t, prop, recv) {
      return Reflect.get(getDb(), prop, recv)
    },
    set(_t, prop, val, recv) {
      return Reflect.set(getDb(), prop, val, recv)
    },
    getOwnPropertyDescriptor(_t, prop) {
      const real = Object.getOwnPropertyDescriptor(getDb() as unknown as object, prop)
      if (real)
        return real
      return typeof prop !== 'symbol'
        ? { configurable: true, enumerable: String(prop).startsWith('$'), writable: true }
        : undefined
    },
    ownKeys() {
      const d = getDb() as unknown as object
      return Reflect.ownKeys(d)
    },
    has(_t, prop) {
      return prop in getDb()
    },
  },
) as unknown as AnyDb

export { schema }
