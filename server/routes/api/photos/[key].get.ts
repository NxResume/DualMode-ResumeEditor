// 读取证件照：R2（本地 dev 为 .data/r2-photos/）→ 带不可变缓存头返回。
// key 只认 uuid + 白名单扩展名（isValidPhotoKey），无路径注入面；
// URL 以 .jpg/.png/.webp 结尾，配合 Cache-Control 可被 Cloudflare 边缘缓存，
// 大部分读取不会回源到 Functions。
export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key') || ''
  if (!isValidPhotoKey(key)) {
    throw createError({
      statusCode: 400,
      message: '非法的图片标识',
    })
  }

  const photo = await readPhoto(key)
  if (!photo) {
    throw createError({
      statusCode: 404,
      message: '图片不存在',
    })
  }

  setResponseHeader(event, 'Content-Type', photo.contentType)
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return new Uint8Array(photo.data)
})
