import { NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server";
// import { EmbeddingService } from '../../../../../services/embedding'
// import { embedAndStore } from '../../../../../services/embedding'
import { searchSimilar } from '../../../../../services/embedding'

export async function POST(req: Request) {
  try {

    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      userId,
    )

    if (results === "no document found.") {
      return NextResponse.json({
        detail: "Please upload a document to search.",
        result: null
      })
      // throw new Error('No search results found')
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