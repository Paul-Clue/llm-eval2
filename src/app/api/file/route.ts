import { NextResponse } from 'next/server'
import { embedAndStore } from '../../../../services/embedding'
import { v4 as uuidv4 } from 'uuid'
// import pdfParse from 'pdf-parse'
import pdf from 'pdf-parse/lib/pdf-parse'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { text } = await pdf(buffer)

    const docId = uuidv4()
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
      result: { text, id: docId }
    })

  } catch (error) {
    console.error('Error processing PDF:', error)
    return NextResponse.json({
      detail: `Error processing PDF: ${error}`,
      result: null
    }, { status: 500 })
  }
}