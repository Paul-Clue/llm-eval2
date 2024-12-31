import { NextResponse } from 'next/server'
import { EmbeddingService } from '@/utils/embedding'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await extractTextFromPDF(buffer) // You'll need to implement this

    const docId = uuidv4()
    const embeddingService = new EmbeddingService()
    
    const success = await embeddingService.embedAndStore(text, {
      id: docId,
      text,
      type: 'pdf'
    })

    if (!success) {
      throw new Error('Failed to store embeddings')
    }

    return NextResponse.json({
      detail: "PDF processed successfully",
      result: { id: docId }
    })

  } catch (error) {
    console.error('Error processing PDF:', error)
    return NextResponse.json({
      detail: `Error processing PDF: ${error}`,
      result: null
    }, { status: 500 })
  }
}