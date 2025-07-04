import { prisma } from '~/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const settings = await prisma.resumeSettings.findUnique({
    where: { resumeId: id },
  })

  return { success: true, data: settings }
})
