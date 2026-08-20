import { eq } from 'drizzle-orm'
import { db, schema } from '~/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    await assertResumeOwnership(event, id)

    const body = await readBody(event)

    const [resume] = await db.update(schema.resumes).set({
      name: body.name,
      content: body.content,
      theme: body.theme,
      plugins: JSON.stringify(body.plugins || []),
      updatedAt: new Date(),
    }).where(eq(schema.resumes.id, id!))

    // 查询更新后的完整简历（带 settings）
    const updated = await db.query.resumes.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.id, id!),
      with: {
        settings: true,
      },
    })

    return {
      success: true,
      data: updated ?? resume,
    }
  }
  catch (error: any) {
    if (error?.statusCode)
      throw error

    throw createError({
      statusCode: 500,
      message: error?.message || '更新简历失败',
    })
  }
})
