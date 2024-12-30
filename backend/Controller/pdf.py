from fastapi import APIRouter, UploadFile, File
from schema import ResponseSchema
from Service.embedding import EmbeddingService
from Model.pdf import SearchRequest
import PyPDF2
import io
import uuid

router = APIRouter(
    prefix="/pdf",
    tags=["pdf"]
)

embedding_service = EmbeddingService()

@router.post("/upload", response_model=ResponseSchema)
async def upload_pdf(file: UploadFile = File(...)):
    try:
        # Read PDF
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        # Create metadata
        doc_id = str(uuid.uuid4())
        metadata = {
            'id': doc_id,
            'filename': file.filename,
            'content_type': file.content_type,
            'text': text
        }
        
        print(f"Uploading PDF with metadata length: {len(str(metadata))}")
        
        # Embed and store
        success = await embedding_service.embed_and_store(text, metadata)
        
        if not success:
            raise Exception("Failed to embed and store document")
        
        return ResponseSchema(
            detail="PDF processed and embedded successfully",
            result={
                "text": text,
                "doc_id": doc_id
            }
        )
    except Exception as e:
        return ResponseSchema(
            detail=f"Error processing PDF: {str(e)}",
            result=None
        )
    
# @router.post("/search", response_model=ResponseSchema)
# async def search_pdf(systemPrompt: str, userPrompt: str, expectedOutput: str, model: str):
#     try:
#         results = await embedding_service.search_similar(systemPrompt, userPrompt, expectedOutput, model)
#         if not results:
#             raise Exception("No search results found")
            
#         return ResponseSchema(
#             detail="Search completed successfully",
#             result=results
#         )
#     except Exception as e:
#         return ResponseSchema(
#             detail=f"Error searching PDFs: {str(e)}",
#             result=None
#         )
@router.post("/search", response_model=ResponseSchema)
async def search_pdf(request: SearchRequest):
    # print("PDF Search Request: ", request)
    try:
        results = await embedding_service.search_similar(
            request.systemPrompt,
            request.userPrompt,
            request.expectedOutput,
            request.model
        )
        if not results:
            raise Exception("No search results found")
            
        return ResponseSchema(
            detail="Search completed successfully",
            result=results
        )
    except Exception as e:
        return ResponseSchema(
            detail=f"Error searching PDFs: {str(e)}",
            result=None
        )