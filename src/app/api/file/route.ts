import { NextResponse } from 'next/server'
import { embedAndStore } from '../../../../services/embedding'
import { v4 as uuidv4 } from 'uuid'
import pdf from 'pdf-parse/lib/pdf-parse'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const data = await pdf(buffer)
    const text = data.text

    const docId = uuidv4()
    const result = await embedAndStore(text, {
      id: docId,
      text,
      type: 'pdf'
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to store embeddings')
    }

    return NextResponse.json({
      detail: "PDF processed successfully",
      result: { text, id: docId }
    })

  } catch (error) {
    console.error('Error processing PDF:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}