import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    const settings = await prisma.resumeSettings.update({
      where: { resumeId: id },
      data: {
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
    })

    return {
      success: true,
      data: settings,
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error || '更新设置失败',
    })
  }
})
