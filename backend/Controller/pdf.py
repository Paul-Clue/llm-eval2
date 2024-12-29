from fastapi import APIRouter, UploadFile, File
from schema import ResponseSchema
import PyPDF2
import io

router = APIRouter(
    prefix="/pdf",
    tags=["pdf"]
)

@router.post("/upload", response_model=ResponseSchema)
async def upload_pdf(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        return ResponseSchema(
            detail="PDF processed successfully",
            result={"text": text}
        )
    except Exception as e:
        return ResponseSchema(
            detail=f"Error processing PDF: {str(e)}",
            result=None
        ) 