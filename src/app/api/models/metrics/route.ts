import { NextResponse } from 'next/server'
import { getMetrics } from '../../../../../services/metrics'
import { auth } from '@clerk/nextjs/server';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ message: 'No user id found' });
    }
    
    const { searchParams } = new URL(req.url)
    const model = searchParams.get('model')
    
    const metrics = await getMetrics(model || undefined, userId)
    
    return NextResponse.json({
      detail: "Metrics retrieved successfully",
      result: metrics
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json({
      detail: `Error fetching metrics: ${error}`,
      result: null
    }, { status: 500 })
  }
}