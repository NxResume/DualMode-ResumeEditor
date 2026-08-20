// 该文件同时运行在 Node 与 Workers（edge）环境：Workers 上 process 是全局
// polyfill，不能 require("process")，故禁用 prefer-global/process 检查
/* eslint-disable node/prefer-global/process */
import type { MySql2Database } from 'drizzle-orm/mysql2'
import { drizzle } from 'drizzle-orm/mysql2'
import { createPool } from 'mysql2/promise'
import * as schema from '../../db/schema'

const globalForDb = globalThis as unknown as {
  __resumeDb: MySql2Database<typeof schema> | undefined
  __resumePool: any
}

/**
 * 按运行时选择数据库连接方式：
 *
 *   - Node（本地 dev / 传统 node-server 部署）：
 *       mysql2/promise 连接池直连 process.env.DATABASE_URL
 *
 *   - Cloudflare Workers / Pages Functions（含 Hyperdrive）：
 *       mysql2 v3.13+ 直接把 env.HYPERDRIVE 的 host/port/user/password/database
 *       传给 createConnection + disableEval:true，由 Hyperdrive 透明代理到源 MySQL
 *       （Cloudflare 官方 mysql2 指南模式）
 *
 * 注意：
 *   1) 在 Pages Functions 里必须开 `nodejs_compat` flag（见 wrangler.jsonc），
 *      否则 mysql2 依赖的 Node 原生模块会 undefined。
 *   2) env.HYPERDRIVE 是 wrangler.jsonc 或 Pages Dashboard 中配置的 Hyperdrive
 *      binding：{ host, port, user, password, database, connectionString }
 *   3) 为了不破坏现有 `import { db } from '~/utils/db'` 的使用方式，
 *      这里用 Proxy 做延迟初始化：第一次访问 db 的任意属性时才真正创建
 *      Drizzle 实例，避免 import 阶段 Nitro useRuntimeConfig 尚未就绪。
 */

function parseDatabaseUrl(url: string) {
  const m = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)
  if (!m)
    throw new Error(`Invalid DATABASE_URL: ${url}`)
  return { user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5] }
}

/**
 * Nitro 在 Pages Functions 里会把 Pages env 放到 process.env；
 * 不同版本有时会漏同步，这里兜底从 useRuntimeConfig().nitro.cloudflare.env 里再读一次。
 * （只在 event handler 中 safe；import 阶段 useRuntimeConfig 可能抛，已用 try/catch 忽略）
 */
function getEnvWithBindings(): Record<string, any> {
  const env: Record<string, any> = { ...process.env }

  if (!env.HYPERDRIVE) {
    try {
      let rt: any = (globalThis as any).__NUXT_RUNTIME_CONFIG__
      if (!rt && typeof useRuntimeConfig === 'function')
        rt = useRuntimeConfig()

      const nitroCloudflareEnv = rt?.nitro?.cloudflare?.env
      if (nitroCloudflareEnv?.HYPERDRIVE)
        env.HYPERDRIVE = nitroCloudflareEnv.HYPERDRIVE

      // sidebase-auth / oauth secrets 也顺带兜底（Dashboard 里常和 Hyperdrive 一起配）
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

function createDrizzle(): MySql2Database<typeof schema> {
  const env = getEnvWithBindings()

  // Workers / Pages Functions + Hyperdrive
  if (env.HYPERDRIVE && typeof env.HYPERDRIVE === 'object' && env.HYPERDRIVE.host) {
    const h = env.HYPERDRIVE
    const pool = createPool({
      host: h.host,
      user: h.user,
      password: h.password,
      database: h.database,
      port: h.port ?? 3306,
      // Required to enable mysql2 compatibility for Workers
      disableEval: true,
      connectionLimit: 1,
      maxIdle: 1,
      waitForConnections: true,
      enableKeepAlive: true,
    })
    globalForDb.__resumePool = pool
    return drizzle(pool, { schema, mode: 'default' })
  }

  // Node：直连 DATABASE_URL
  const url = env.DATABASE_URL
  if (!url)
    throw new Error('DATABASE_URL is not set')

  const { host, port, user, password, database } = parseDatabaseUrl(url)
  const pool = createPool({ host, port, user, password, database })
  globalForDb.__resumePool = pool
  return drizzle(pool, { schema, mode: 'default' })
}

// 延迟初始化单例
let lazyDb: MySql2Database<typeof schema> | undefined = globalForDb.__resumeDb

export function getDb(): MySql2Database<typeof schema> {
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
 * 才会创建 Drizzle 实例。这样：
 *   · 模块 import 阶段不会急着去读 runtime（useRuntimeConfig 还没 ready）
 *   · HMR 不影响；module-level side-effect 被去掉
 *   · 原有 server routes 一行都不用改（除 prisma 属性名 → db 属性名）
 */
export const db = new Proxy(
  {} as MySql2Database<typeof schema>,
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
) as unknown as MySql2Database<typeof schema>

export { schema }
