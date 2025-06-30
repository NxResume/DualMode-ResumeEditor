import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { resumes, allSettings } = body

    // 批量创建简历和设置
    for (const resume of resumes) {
      await prisma.resume.create({
        data: {
          id: resume.id,
          name: resume.name,
          content: resume.content,
          theme: resume.theme,
          plugins: JSON.stringify(resume.plugins || []),
          isDefault: resume.isDefault || false,
          createdAt: new Date(resume.createdAt),
          updatedAt: new Date(resume.updatedAt),
          settings: {
            create: {
              ...allSettings[resume.id],
              imagePosition: JSON.stringify(allSettings[resume.id]?.imagePosition || {}),
            },
          },
        },
      })
    }

    return { success: true, message: '数据迁移成功' }
  }
  catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error || '数据迁移失败',
    })
  }
})
