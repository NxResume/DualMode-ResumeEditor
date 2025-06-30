import { prisma } from '../../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const settings = await prisma.resumeSettings.findUnique({
    where: { resumeId: id },
  })
  if (!settings) {
    // 返回 404 JSON
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  return { success: true, data: settings }
})
