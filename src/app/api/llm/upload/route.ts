import { NextResponse } from 'next/server'
// import { embedAndStore, searchSimilar } from '../../../../../services/embedding'
import { embedAndStore } from '../../../../../services/embedding'
import { v4 as uuidv4 } from 'uuid'
import pdfParse from 'pdf-parse'

console.log("IT RAN 1")
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer)
  return data.text
}

export async function POST(req: Request) {
  console.log("IT RAN 1")
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await extractTextFromPDF(buffer) // You'll need to implement this

    const docId = uuidv4()
    // const embeddingService = new EmbeddingService()
    
    const success = await embedAndStore(text, {
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