import { prisma } from '../../utils/db'
// import { Metrics } from './types'
import { Prisma } from '@prisma/client'

export async function createMetrics(data: Prisma.evaluation_metricsCreateInput) {
  return await prisma.evaluation_metrics.create({
    data
  })
}

export async function getMetrics(model?: string, userId?: string) {
  if (model) {
    return await prisma.evaluation_metrics.findMany({
      where: {
        userId: userId,
        ...(model ? { modelName: model } : {}),
      },
      orderBy: {
        id: 'desc',
      },
    })
  }
  return await prisma.evaluation_metrics.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      id: 'desc',
    },
  })
}