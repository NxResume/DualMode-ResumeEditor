import type { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * 按运行时选择 Prisma 初始化方式：
 *
 *   - Node（本地 dev / 传统 node-server 部署）：
 *       `@prisma/client`（默认入口，binary engine） + process.env.DATABASE_URL
 *
 *   - Cloudflare Workers / Pages Functions（含 Hyperdrive）：
 *       `@prisma/client/edge`（wasm engine —— Prisma 5/6 官方 Edge 入口）
 *       + 从 env.HYPERDRIVE 拼出来的 DATABASE_URL。
 *       env.HYPERDRIVE 是 wrangler.jsonc 或 Pages Dashboard 中配置的
 *       Hyperdrive binding：
 *           { host, port, user, password, database, connectionString }
 *
 * 注意：
 *   1) 在 Pages Functions 里必须开 `nodejs_compat` flag（见 wrangler.jsonc），
 *      否则 bcrypt/nodemailer 等依赖用的 Node 原生模块会 undefined。
 *   2) Hyperdrive 是 Cloudflare 到源 MySQL 的代理：Prisma 只认 DATABASE_URL，
 *      所有 TCP 封包通过 Hyperdrive HTTP/WebSocket 隧道发出，源库看不出来区别。
 *   3) 为了不破坏现有 `import { prisma } from '~/utils/db'` 的使用方式，
 *      这里用 Proxy 做延迟初始化：第一次访问 prisma 的任意属性时才真正创建
 *      PrismaClient，避免 import 阶段 Nitro useRuntimeConfig 尚未就绪。
 */

function buildDatabaseUrl(envLike: Record<string, any> = process.env): string {
  // 1) 直接配了 DATABASE_URL（本地 Node / Node 生产 / 手动 override）
  if (envLike.DATABASE_URL)
    return envLike.DATABASE_URL

  // 2) Cloudflare Hyperdrive binding：env.HYPERDRIVE.{host,port,user,password,database}
  const hyper = envLike.HYPERDRIVE
  if (hyper && typeof hyper === 'object' && hyper.host && hyper.database) {
    const {
      host, port = 3306, user, password, database,
    } = hyper /* MySQL 默认 3306 */
    const userInfo = user ? `${encodeURIComponent(user)}${password ? `:${encodeURIComponent(password)}` : ''}@` : ''
    // schema.prisma datasource 里是 mysql provider
    return `mysql://${userInfo}${host}:${port}/${encodeURIComponent(database)}`
  }

  // 3) 兜底：让 Prisma 自己报缺 DATABASE_URL 的错，方便排查
  return ''
}

/**
 * 判断当前是不是 Cloudflare Workers / Pages Functions runtime。
 * （从多个特征综合判断，避免误判）
 */
function detectWorkersRuntime(env: Record<string, any>): boolean {
  const g = globalThis as any
  return Boolean(
    // Cloudflare Workers 全局特有
    typeof g.WebSocketPair !== 'undefined'
    || typeof g.__STATIC_CONTENT !== 'undefined'
    || typeof g.caches !== 'undefined' && g.caches?.default && typeof g.addEventListener === 'function'
    // Nitro preset 明确是 Cloudflare
    || /cloudflare/i.test(env.NITRO_PRESET ?? '')
    // 或已经拿到 Hyperdrive binding（最常见）
    || env.HYPERDRIVE,
  )
}

/**
 * Nitro 在 Pages Functions 里会把 Pages env 放到 process.env；
 * 不同版本有时会漏同步，这里兜底从 useRuntimeConfig().nitro.cloudflare.env 里再读一次。
 * （只在 event handler 中 safe；import 阶段 useRuntimeConfig 可能抛，已用 try/catch 忽略）
 */
function getEnvWithHyperdriveBindings(): Record<string, any> {
  const env: Record<string, any> = { ...process.env }

  if (!env.HYPERDRIVE) {
    try {
      // 仅在函数里已经 init runtime config 的情况下尝试兜底
      let rt: any = (globalThis as any).__NUXT_RUNTIME_CONFIG__
      if (!rt && typeof useRuntimeConfig === 'function')
        rt = useRuntimeConfig()

      const nitroCloudflareEnv = rt?.nitro?.cloudflare?.env
      if (nitroCloudflareEnv?.HYPERDRIVE)
        env.HYPERDRIVE = nitroCloudflareEnv.HYPERDRIVE

      // sidebase-auth / oauth secrets 也顺带兜底（Dashboard 里常和 Hyperdrive 一起配）
      for (const k of [
        'AUTH_SECRET', 'AUTH_ORIGIN',
        'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET',
        'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
        'GITEE_CLIENT_ID', 'GITEE_CLIENT_SECRET',
        'LINUXDO_CLIENT_ID', 'LINUXDO_CLIENT_SECRET',
        'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS',
      ]) {
        if (nitroCloudflareEnv?.[k] != null)
          env[k] = nitroCloudflareEnv[k]
      }
    }
    catch {}
  }

  return env
}

function createPrismaClient(): PrismaClient {
  const env = getEnvWithHyperdriveBindings()
  const datasourceUrl = buildDatabaseUrl(env)
  const isWorkers = detectWorkersRuntime(env)

  // eslint-disable-next-line ts/no-require-imports
  const mod: typeof import('@prisma/client') = isWorkers
    ? require('@prisma/client/edge')  // Workers → wasm engine，不 spawn 子进程
    : require('@prisma/client')       // Node → binary engine，cold start 更快

  const { PrismaClient } = mod

  return new PrismaClient({
    datasources: datasourceUrl ? { db: { url: datasourceUrl } } : undefined,
    log: ['warn', 'error'],
  }) as PrismaClient
}

// 延迟初始化单例
let lazyPrisma: PrismaClient | undefined = globalForPrisma.prisma

export function getPrisma(): PrismaClient {
  if (!lazyPrisma) {
    lazyPrisma = createPrismaClient()
    if (!globalForPrisma.prisma)
      globalForPrisma.prisma = lazyPrisma
  }
  return lazyPrisma
}

/**
 * 向后兼容：保持 `import { prisma } from '~/utils/db'` 的写法不变
 *
 * 用 Proxy 实现延迟：第一次真正访问 prisma.resume / prisma.user 等属性时
 * 才会创建 PrismaClient。这样：
 *   · 模块 import 阶段不会急着去读 runtime（useRuntimeConfig 还没 ready）
 *   · HMR 不影响；module-level side-effect 被去掉
 *   · 原有 server routes / providers/index.ts 一行都不用改
 */
export const prisma = new Proxy(
  // 空的占位 object：不导出任何方法，全靠 target=getPrisma() 做转发
  {} as PrismaClient,
  {
    get(_t, prop, recv) {
      return Reflect.get(getPrisma(), prop, recv)
    },
    set(_t, prop, val, recv) {
      return Reflect.set(getPrisma(), prop, val, recv)
    },
    getOwnPropertyDescriptor(_t, prop) {
      const real = Object.getOwnPropertyDescriptor(getPrisma() as unknown as object, prop)
      if (real)
        return real
      // 对没有的属性也返回 writable/configurable，避免消费方做 Object.keys/解构时炸
      return typeof prop !== 'symbol'
        ? { configurable: true, enumerable: String(prop).startsWith('$'), writable: true }
        : undefined
    },
    ownKeys() {
      const p = getPrisma() as unknown as object
      return Reflect.ownKeys(p)
    },
    has(_t, prop) {
      return prop in getPrisma()
    },
  },
) as unknown as PrismaClient

export type { PrismaClient }
