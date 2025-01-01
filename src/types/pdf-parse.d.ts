declare module 'pdf-parse' {
  function PDFParse(buffer: Buffer): Promise<{ text: string }>
  export default PDFParse
}