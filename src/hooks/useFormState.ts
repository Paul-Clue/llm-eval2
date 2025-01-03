import { useState } from 'react';

export function useFormState() {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [testModel, setTestModel] = useState('');
  const [documentTest, setDocumentTest] = useState(false);
  const [pdfText, setPdfText] = useState<string>('');
  const [showPdfText, setShowPdfText] = useState(false);

  const resetForm = () => {
    setSystemPrompt('');
    setUserPrompt('');
    setExpectedOutput('');
  };

  return {
    systemPrompt,
    setSystemPrompt,
    userPrompt,
    setUserPrompt,
    expectedOutput,
    setExpectedOutput,
    testModel,
    setTestModel,
    documentTest,
    setDocumentTest,
    pdfText,
    setPdfText,
    showPdfText,
    setShowPdfText,
    resetForm,
  };
}