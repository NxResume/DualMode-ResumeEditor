import { prisma } from '~/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: '简历ID不能为空',
      })
    }

    const body = await readBody(event)
    const settings = await prisma.resumeSettings.upsert({
      where: { resumeId: id },
      update: {
        fontname: body.fontname,
        pagePadding: body.pagePadding,
        pageLineHeight: body.pageLineHeight,
        pageBackground: body.pageBackground,
        pageThemeColor: body.pageThemeColor,
        imagePosition: JSON.stringify(body.imagePosition),
        isScrollable: body.isScrollable,
        editorMode: body.editorMode,
        updatedAt: new Date(),
      },
      create: {
        resumeId: id,
        fontname: body.fontname || 'default',
        pagePadding: body.pagePadding || 36,
        pageLineHeight: body.pageLineHeight || 1.9,
        pageBackground: body.pageBackground || 'default',
        pageThemeColor: body.pageThemeColor || '0,0,0',
        imagePosition: JSON.stringify(body.imagePosition || '{ top: 66, left: 391, scale: \'0.8 0.8\' }'),
        isScrollable: body.isScrollable || false,
        editorMode: body.editorMode || 'source',
      },
    })

    return {
      success: true,
      data: settings,
    }
  }
  catch (error: any) {
    // 错误处理优化：使用 message 字段
    if (error.code === 'P2003') {
      throw createError({
        statusCode: 400,
        message: '外键约束错误：关联的简历不存在',
      })
    }

    throw createError({
      statusCode: 500,
      message: error.message || '更新设置失败',
    })
  }
})
