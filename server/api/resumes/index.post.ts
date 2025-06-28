import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const resume = await prisma.resume.create({
      data: {
        name: body.name,
        content: body.content,
        theme: body.theme,
        plugins: JSON.stringify(body.plugins || []),
        isDefault: body.isDefault || false,
        settings: {
          create: {
            fontname: body.settings?.fontname || 'default',
            pagePadding: body.settings?.pagePadding || 36,
            pageLineHeight: body.settings?.pageLineHeight || 1.9,
            pageBackground: body.settings?.pageBackground || 'default',
            pageThemeColor: body.settings?.pageThemeColor || '0,0,0',
            imagePosition: JSON.stringify(body.settings?.imagePosition || { top: 66, left: 391, scale: '0.8 0.8' }),
            isScrollable: body.settings?.isScrollable || false,
            editorMode: body.settings?.editorMode || 'source',
          },
        },
      },
      include: {
        settings: true,
      },
    })

    return {
      success: true,
      data: resume,
    }
  }
  catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '创建简历失败',
    })
  }
})
