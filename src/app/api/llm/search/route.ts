import { NextResponse } from 'next/server'
// import { EmbeddingService } from '../../../../../services/embedding'
// import { embedAndStore } from '../../../../../services/embedding'
import { searchSimilar } from '../../../../../services/embedding'

export async function POST(req: Request) {
  try {
    const { systemPrompt, userPrompt, expectedOutput, model, document } = await req.json()
    
    // const embeddingService = new EmbeddingService()
    // await embedAndStore(
    //   systemPrompt,
    //   userPrompt,
    //   expectedOutput,
    //   model
    // )
    const results = await searchSimilar(
      systemPrompt,
      userPrompt,
      expectedOutput,
      model,
      document,
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