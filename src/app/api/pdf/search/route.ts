import { NextResponse } from 'next/server'
import { EmbeddingService } from '../../../../../services/embedding'

export async function POST(req: Request) {
  try {
    const { systemPrompt, userPrompt, expectedOutput, model } = await req.json()
    
    const embeddingService = new EmbeddingService()
    const results = await embeddingService.searchSimilar(
      systemPrompt,
      userPrompt,
      expectedOutput,
      model
    )

    if (!results) {
      throw new Error('No search results found')
    }

    return NextResponse.json({
      detail: "Search completed successfully",
      result: results
    })

  } catch (error) {
    console.error('Error searching PDFs:', error)
    return NextResponse.json({
      detail: `Error searching PDFs: ${error}`,
      result: null
    }, { status: 500 })
  }
}