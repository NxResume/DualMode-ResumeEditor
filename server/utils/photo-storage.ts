// 证件照存储（双模式，与 app/utils/db.ts 同思路）：
//   - Cloudflare Workers / Pages Functions：R2 绑定 env.PHOTOS（保持私有桶）
//   - Node（本地 dev / node-server）：降级写 .data/r2-photos/ 本地目录
// 该文件会同时打进 Workers bundle，node:fs 只能在 Node 分支里
// 通过 createRequire 运行时加载（与 db.ts 加载 better-sqlite3 的方式一致）。
/* eslint-disable node/prefer-global/process */
import { createRequire } from 'node:module'

const LOCAL_DIR = '.data/r2-photos'

/** object key：uuid + 白名单扩展名（同时防路径穿越，读写前都必须过这个校验） */
const KEY_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(?:jpg|png|webp)$/

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export interface StoredPhoto {
  data: ArrayBuffer
  contentType: string
}

// 只用到 R2Bucket 的 put/get 子集，最小接口声明即可
interface R2LikeBucket {
  put: (key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>
  get: (key: string) => Promise<{ arrayBuffer: () => Promise<ArrayBuffer> } | null>
}

/**
 * Nitro 在 Pages Functions 里会把 Pages env 同步到 process.env，
 * 个别版本会漏，这里兜底从 useRuntimeConfig().nitro.cloudflare.env 再读一次（同 db.ts）。
 */
function getR2Bucket(): R2LikeBucket | null {
  const fromProcess = (process.env as Record<string, any>).PHOTOS
  if (fromProcess && typeof fromProcess === 'object' && 'put' in fromProcess && 'get' in fromProcess)
    return fromProcess as R2LikeBucket

  try {
    let rt: any = (globalThis as any).__NUXT_RUNTIME_CONFIG__
    if (!rt && typeof useRuntimeConfig === 'function')
      rt = useRuntimeConfig()
    const bucket = rt?.nitro?.cloudflare?.env?.PHOTOS
    if (bucket && typeof bucket === 'object' && 'put' in bucket)
      return bucket as R2LikeBucket
  }
  catch {}

  return null
}

function onWorkers(): boolean {
  return typeof navigator !== 'undefined'
    && typeof navigator.userAgent === 'string'
    && navigator.userAgent.includes('Cloudflare-Workers')
}

/** Workers 上漏配 R2 绑定时调用方可以提前给出明确错误，而不是走到一半崩掉 */
export function isPhotoStorageReady(): boolean {
  return getR2Bucket() !== null || !onWorkers()
}

export function isValidPhotoKey(key: string): boolean {
  return KEY_RE.test(key)
}

export function contentTypeForKey(key: string): string {
  const ext = key.slice(key.lastIndexOf('.') + 1)
  return EXT_MIME[ext] || 'application/octet-stream'
}

function getFs() {
  const require = createRequire(import.meta.url)
  return require('node:fs') as typeof import('node:fs')
}

export async function savePhoto(key: string, data: ArrayBuffer, contentType: string): Promise<void> {
  if (!isValidPhotoKey(key))
    throw new Error(`非法的图片 key：${key}`)

  const bucket = getR2Bucket()
  if (bucket) {
    await bucket.put(key, data, { httpMetadata: { contentType } })
    return
  }

  const fs = getFs()
  await fs.promises.mkdir(LOCAL_DIR, { recursive: true })
  await fs.promises.writeFile(`${LOCAL_DIR}/${key}`, new Uint8Array(data))
}

export async function readPhoto(key: string): Promise<StoredPhoto | null> {
  if (!isValidPhotoKey(key))
    return null

  const bucket = getR2Bucket()
  if (bucket) {
    const obj = await bucket.get(key)
    if (!obj)
      return null
    return { data: await obj.arrayBuffer(), contentType: contentTypeForKey(key) }
  }

  const fs = getFs()
  try {
    const data = await fs.promises.readFile(`${LOCAL_DIR}/${key}`)
    // readFile 返回 Node Buffer（底层可能是 SharedArrayBuffer 视图）；
    // 显式拷贝成纯 ArrayBuffer，避免跨运行时类型差异
    const ab = new ArrayBuffer(data.byteLength)
    new Uint8Array(ab).set(data)
    return { data: ab, contentType: contentTypeForKey(key) }
  }
  catch (err: any) {
    if (err?.code === 'ENOENT')
      return null
    throw err
  }
}
