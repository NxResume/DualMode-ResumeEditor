import { randomUUID } from 'node:crypto'
import { db, schema } from '~/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCurrentUser(event)

    const body = await readBody(event)
    const { name, content, theme, plugins, isDefault } = body

    const [resume] = await db.insert(schema.resumes).values({
      id: randomUUID().replaceAll('-', '').slice(0, 25),
      name,
      content,
      theme,
      plugins: JSON.stringify(plugins || []),
      isDefault: isDefault ? 1 : 0,
      userId: user.id,
      updatedAt: new Date(),
    }).returning()

    return {
      success: true,
      data: resume,
    }
  }
  catch (error: any) {
    console.error('Error creating resume:', error)

    if (error?.statusCode)
      throw error

    throw createError({
      statusCode: 500,
      message: error?.message || '创建简历失败',
    })
  }
})
