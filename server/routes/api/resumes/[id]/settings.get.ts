import { db } from '~/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    await assertResumeOwnership(event, id)

    const settings = await db.query.resumeSettings.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.resumeId, id!),
    })

    return { success: true, data: settings }
  }
  catch (error: any) {
    if (error?.statusCode)
      throw error

    throw createError({
      statusCode: 500,
      message: error?.message || '获取设置失败',
    })
  }
})
