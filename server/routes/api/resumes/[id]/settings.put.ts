import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db, schema } from '~/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: '简历ID不能为空',
      })
    }

    await assertResumeOwnership(event, id)

    const body = await readBody(event)

    // upsert：先查，存在则更新，不存在则插入
    const existing = await db.query.resumeSettings.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.resumeId, id),
    })

    let settings
    if (existing) {
      const [updated] = await db.update(schema.resumeSettings).set({
        fontname: body.fontname,
        pagePadding: body.pagePadding,
        pageLineHeight: body.pageLineHeight,
        pageBackground: body.pageBackground,
        pageThemeColor: body.pageThemeColor,
        imagePosition: JSON.stringify(body.imagePosition),
        isScrollable: body.isScrollable ? 1 : 0,
        editorMode: body.editorMode,
        updatedAt: new Date(),
      }).where(eq(schema.resumeSettings.resumeId, id))
      settings = updated
    }
    else {
      const [created] = await db.insert(schema.resumeSettings).values({
        id: randomUUID().replaceAll('-', '').slice(0, 25),
        resumeId: id,
        fontname: body.fontname || 'default',
        pagePadding: body.pagePadding || 36,
        pageLineHeight: body.pageLineHeight || 1.9,
        pageBackground: body.pageBackground || 'default',
        pageThemeColor: body.pageThemeColor || '0,0,0',
        imagePosition: JSON.stringify(body.imagePosition || { top: 66, left: 391, scale: '0.8 0.8' }),
        isScrollable: body.isScrollable ? 1 : 0,
        editorMode: body.editorMode || 'source',
        updatedAt: new Date(),
      }).$returningId()
      settings = created
    }

    // 返回完整记录
    const result = await db.query.resumeSettings.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.resumeId, id),
    })

    return {
      success: true,
      data: result ?? settings,
    }
  }
  catch (error: any) {
    // 已带状态码的错误（400/401/403/404 等）直接透传，避免被包装成 500
    if (error?.statusCode)
      throw error

    throw createError({
      statusCode: 500,
      message: error.message || '更新设置失败',
    })
  }
})
