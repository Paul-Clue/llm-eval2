import { prisma } from '../../utils/db'
import { Metrics } from './types'

export async function createMetrics(data: Metrics) {
  return await prisma.evaluation_metrics.create({
    data
  })
}

export async function getMetrics(model?: string) {
  if (model) {
    return await prisma.evaluation_metrics.findMany({
      where: {
        modelName: model
      }
    })
  }
  return await prisma.evaluation_metrics.findMany()
}