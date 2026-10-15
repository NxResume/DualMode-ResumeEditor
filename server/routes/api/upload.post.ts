import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import type { H3Event } from 'h3'
import { getServerSession } from '#auth'
import { and, count, eq, gt } from 'drizzle-orm'
import { getDb, schema } from '~/utils/db'

// ============================================================
// 证件照上传（R2）
//
// 防滥用措施：
//   1. 大小限制 5MB（Content-Length 提前拦截 + 读入后再校验一次）
//   2. 类型白名单：只认 JPG / PNG / WebP，且以文件头魔数为准
//      （MIME 声明可伪造；同时天然挡掉 SVG 等可携带脚本的格式）
//   3. 速率限制：登录用户按 email 计、匿名按 IP 计，1 小时 10 张；
//      另有全站每小时总量上限，防 IP 轮换刷量
//   4. object key 由服务端生成（uuid），文件名不透传，无路径注入面
//   5. 每次上传落一条 photoUploads 记录（审计 + 速率限制依据）
// ============================================================

const MAX_BYTES = 5 * 1024 * 1024
const WINDOW_MS = 60 * 60 * 1000 // 1 小时
const MAX_PER_ACTOR = 10 // 单个用户 / IP 每小时
const MAX_GLOBAL_PER_WINDOW = 200 // 全站每小时总量

type SniffedType = { mime: string, ext: 'jpg' | 'png' | 'webp' } | null

/** 文件头魔数识别，只放行三种位图格式 */
function sniffImageType(bytes: Uint8Array): SniffedType {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF)
    return { mime: 'image/jpeg', ext: 'jpg' }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 && bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A)
    return { mime: 'image/png', ext: 'png' }
  // WebP: 'RIFF' .... 'WEBP'
  if (bytes.length >= 12 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50)
    return { mime: 'image/webp', ext: 'webp' }
  return null
}

/** 速率限制主体：登录 = user:email，匿名 = ip:真实IP（Cloudflare 下取 cf-connecting-ip） */
async function resolveActor(event: H3Event): Promise<string> {
  try {
    const session = await getServerSession(event)
    const email = session?.user?.email
    if (email)
      return `user:${email}`
  }
  catch {}

  const ip
    = getRequestHeader(event, 'cf-connecting-ip')
      || getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
      || 'unknown'
  return `ip:${ip}`
}

export default defineEventHandler(async (event) => {
  if (!isPhotoStorageReady()) {
    throw createError({
      statusCode: 503,
      message: '图片存储未配置（缺少 R2 绑定 PHOTOS）',
    })
  }

  // 提前按 Content-Length 拒绝超大请求体，避免整个读进内存
  const declaredLength = Number(getRequestHeader(event, 'content-length') || 0)
  if (declaredLength > MAX_BYTES + 64 * 1024) {
    throw createError({
      statusCode: 413,
      message: '图片大小不能超过 5MB',
    })
  }

  const form = await readFormData(event)
  const file = form?.get('file')
  if (!file || typeof file === 'string') {
    throw createError({
      statusCode: 400,
      message: '缺少文件字段 file',
    })
  }

  if (file.size > MAX_BYTES) {
    throw createError({
      statusCode: 413,
      message: '图片大小不能超过 5MB',
    })
  }

  const data = await file.arrayBuffer()
  const sniffed = sniffImageType(new Uint8Array(data).subarray(0, 16))
  if (!sniffed) {
    throw createError({
      statusCode: 415,
      message: '仅支持 JPG / PNG / WebP 格式的图片',
    })
  }

  // ---- 速率限制（photoUploads 表， actor+createdAt 有索引） ----
  const actor = await resolveActor(event)
  // getDb() 返回 D1/better-sqlite3 联合类型，带投影的 select 在联合上过不了
  // 类型检查；两者共享同一套 sqlite-core 查询构建器，断言成具体方言即可
  const db = getDb() as BaseSQLiteDatabase<'sync', any, typeof schema>
  const since = new Date(Date.now() - WINDOW_MS)

  const [perActor] = await db.select({ n: count() }).from(schema.photoUploads).where(and(eq(schema.photoUploads.actor, actor), gt(schema.photoUploads.createdAt, since)))
  if ((perActor?.n ?? 0) >= MAX_PER_ACTOR) {
    throw createError({
      statusCode: 429,
      message: '上传过于频繁，请 1 小时后再试',
    })
  }

  const [total] = await db.select({ n: count() }).from(schema.photoUploads).where(gt(schema.photoUploads.createdAt, since))
  if ((total?.n ?? 0) >= MAX_GLOBAL_PER_WINDOW) {
    throw createError({
      statusCode: 429,
      message: '当前上传总量已达上限，请稍后再试',
    })
  }

  // ---- 存储 + 记录（key 服务端生成，uuid 防猜测） ----
  const key = `${crypto.randomUUID()}.${sniffed.ext}`
  await savePhoto(key, data, sniffed.mime)

  await db.insert(schema.photoUploads).values({
    objectKey: key,
    actor,
    bytes: file.size,
  })

  return {
    url: `/api/photos/${key}`,
  }
})
