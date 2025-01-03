'use client';

import { useState, useEffect, FormEvent } from 'react';
// import { useEffect, FormEvent } from 'react';
import type { EvaluationResponse, Metric } from '../types/ui.d.ts';
import { useFormState } from '../hooks/useFormState';
import { useApi } from '../hooks/UseApi';
import { useUIState } from '../hooks/useUIState';

export default function Home() {
  const {
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
  } = useFormState();

  const {
    isLoading, setIsLoading,
    evaluationResults, setEvaluationResults,
    // fetchMetrics,
    handleSubmit: submitApi,
  } = useApi();

  const {
    selectedCell,
    setSelectedCell,
    selectedModel,
    setSelectedModel,
    models,
  } = useUIState();

  useEffect(() => {
    fetchMetrics(selectedModel);
  }, [selectedModel]);

  // const [systemPrompt, setSystemPrompt] = useState('');
  // const [userPrompt, setUserPrompt] = useState('');
  // const [expectedOutput, setExpectedOutput] = useState('');
  // const [selectedCell, setSelectedCell] = useState<string | null>(null);
  // const [selectedModel, setSelectedModel] = useState('');
  // const [testModel, setTestModel] = useState('');
  // const [documentTest, setDocumentTest] = useState(false);
  // const [isLoading, setIsLoading] = useState(false);
  // const [evaluationResults, setEvaluationResults] = useState<
  //   EvaluationResponse[]
  // >([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  // const models = ['mixtral-8x7b-32768', 'gpt-3.5-turbo', 'gemini-1.5-flash'];
  // const [pdfText, setPdfText] = useState<string>('');
  // const [showPdfText, setShowPdfText] = useState(false);

  // section: document search
  const fetchMetrics = async (model?: string) => {
    try {
      const url = model
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/models/metrics?model=${model}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/api/models/metrics`;
      const response = await fetch(url);
      const data = await response.json();
      setMetrics(data.result);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/models/metrics`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        // setEvaluationResult(data);
        setEvaluationResults(data.result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    fetchMetrics(selectedModel);
  }, [selectedModel]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitApi({
      systemPrompt,
      userPrompt,
      expectedOutput,
      testModel,
      documentTest,
    });
    resetForm();
  };

  // const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   setIsLoading(true);
  //   try {
  //     const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/models/search`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         systemPrompt,
  //         userPrompt,
  //         expectedOutput,
  //         model: testModel,
  //         document: documentTest,
  //       }),
  //     });

  //     const data = await response.json();
  //     if (!data.result) {
  //       alert(data.detail);
  //       console.log('API Error Page:', data.detail);
  //       return;
  //     }
  //     const metricsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/models/metrics`);
  //     if (!metricsResponse.ok)
  //       throw new Error('Failed to fetch updated metrics');
  //     const metricsData = await metricsResponse.json();
  //     setEvaluationResults(metricsData.result);

  //     setSystemPrompt('');
  //     setUserPrompt('');
  //     setExpectedOutput('');
  //   } catch (error) {
  //     console.error('Error:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/file`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.result?.text) {
        setPdfText(data.result.text);
        setShowPdfText(true);
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex flex-col justify-center items-center min-h-screen bg-[#252528] p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)] overflow-x-auto'>
      <div className='flex flex-col gap-4 items-center justify-center mt-[-4%]'>
        <h1 className='text-white text-5xl font-bold mb-4'>LLM Evaluation</h1>

        {/* section: PDF Upload */}
        <div className='flex flex-col gap-2 w-full max-w-4xl'>
          {showPdfText && (
            <div className='bg-white p-4 rounded-lg mt-4'>
              <div className='flex justify-between items-center mb-2 border-b-2 border-black'>
                <h3 className='font-bold text-black'>Extracted PDF Text</h3>
                <button
                  onClick={() => setShowPdfText(false)}
                  className='text-gray-500 hover:text-gray-700'
                >
                  ✕
                </button>
              </div>
              <div className='max-h-[200px] overflow-y-auto whitespace-pre-wrap text-black'>
                {pdfText}
              </div>
            </div>
          )}
        </div>

        {/* section: Form */}
        <form
          // onSubmit={documentTest ? handleSearch : handleSubmit}
          onSubmit={handleSubmit}
          className='flex flex-col gap-1'
        >
          <div className='flex flex-row gap-4 items-center mb-8'>
            <label className='text-white'>Test Type:</label>
            <div className='flex gap-4'>
              <label className='flex items-center gap-2 text-white'>
                <input
                  type='radio'
                  name='testType'
                  value='prompt'
                  checked={!documentTest}
                  onChange={() => setDocumentTest(false)}
                  className='form-radio text-blue-500'
                />
                Prompt Test
              </label>

              <label className='flex items-center gap-2 text-white'>
                <input
                  type='radio'
                  name='testType'
                  value='document'
                  checked={documentTest}
                  onChange={() => setDocumentTest(true)}
                  className='form-radio text-blue-500'
                />
                Document Test
              </label>
            </div>
            {documentTest && (
              <div className='flex flex-row gap-2 items-center ml-[5%]'>
                <label className='text-white' htmlFor='pdfUpload'>
                  Upload PDF:
                </label>
                <input
                  type='file'
                  id='pdfUpload'
                  accept='.pdf'
                  onChange={handleFileUpload}
                  className='text-white'
                />
              </div>
            )}
          </div>
          <div className='flex flex-row gap-4 mb-8'>
            <div className='flex flex-col gap-2'>
              <label className='text-white' htmlFor='systemprompt'>
                System Prompt
              </label>
              <textarea
                id='systemprompt'
                value={systemPrompt}
                className='text-black caret-blue-500 px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
            </div>
            <div className='flex flex-col gap-2'>
              <label className='text-white' htmlFor='userprompt'>
                User Prompt
              </label>
              <textarea
                id='userprompt'
                value={userPrompt}
                className='text-black caret-blue-500 px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                onChange={(e) => setUserPrompt(e.target.value)}
              />
            </div>
            <div className='flex flex-col gap-2'>
              <label className='text-white' htmlFor='expectedoutput'>
                Expected Output
              </label>
              <textarea
                id='expectedoutput'
                value={expectedOutput}
                className='text-black caret-blue-500 px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                onChange={(e) => setExpectedOutput(e.target.value)}
              />
            </div>
            <div className='flex flex-col gap-2 mb-2'>
              <label className='text-white' htmlFor='modelSelect'>
                Model To Test:
              </label>
              <select
                id='modelSelect'
                value={testModel}
                onChange={(e) => setTestModel(e.target.value)}
                className='rounded-md px-2 py-1 text-black'
              >
                <option value=''>Select Model</option>
                <option value='mixtral-8x7b-32768'>Mixtral-8x7b</option>
                <option value='gpt-3.5-turbo'>GPT-3.5</option>
                <option value='gemini-1.5-flash'>Gemini</option>
              </select>
            </div>
            <button
              className='bg-blue-500 text-white p-2 rounded-md h-[35px] mt-8'
              type='submit'
              disabled={isLoading}
            >
              {documentTest ? 'Doc Test' : 'Prompt Test'}
            </button>
          </div>
          <div className='flex flex-row gap-10'>
            <div className='flex flex-col gap-2 mb-4'>
              <label className='text-white' htmlFor='modelFilter'>
                Filter by Model:
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                // className='p-2 border rounded-md text-black'
                className='text-black caret-blue-500 px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>No Filter</option>
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>

        {selectedModel && (
          <div className='w-full max-w-7xl overflow-x-auto mt-8'>
            <table className='min-w-fit bg-white rounded-lg text-black text-xs'>
              <thead className='bg-gray-100'>
                <tr>
                  <th className='w-[80px] px-1 py-1 text-xs'>Model Name</th>
                  <th className='w-[80px] px-1 py-1 text-xs'>Model Type</th>
                  <th className='w-[80px] px-1 py-1 text-xs'>Model Provider</th>
                  <th className='w-[80px] px-1 py-1 text-xs'>
                    Relevance Score
                  </th>
                  <th className='w-[80px] px-1 py-1 text-xs'>Accuracy Score</th>
                  <th className='w-[80px] px-1 py-1 text-xs'>Clarity Score</th>
                  <th className='w-[80px] px-1 py-1 text-xs'>
                    Coherence Score
                  </th>
                  <th className='w-[80px] px-1 py-1 text-xs'>
                    Creativity Score
                  </th>
                  <th className='w-[80px] px-1 py-1 text-xs'>
                    Alignment Score
                  </th>
                  <th className='w-[80px] px-1 py-1 text-xs'>
                    Evaluation Score
                  </th>
                  <th className='w-[80px] px-1 py-1 text-xs'>Evaluation</th>
                  <th className='w-[80px] px-1 py-1 text-xs'>
                    Evaluation Feedback
                  </th>
                  <th className='w-[80px] px-1 py-1 text-xs'>
                    Hallucination Score
                  </th>
                  <th className='w-[80px] px-1 py-1 text-xs'>
                    Hallucination Feedback
                  </th>
                  <th className='w-[80px] px-1 py-1 text-xs'>Test Type</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric: Metric, index: number) => (
                  <tr key={index}>
                    {[
                      'modelName',
                      'modelType',
                      'modelProvider',
                      'relevanceScore',
                      'accuracyScore',
                      'clarityScore',
                      'coherenceScore',
                      'creativityScore',
                      'alignmentScore',
                      'evaluationScore',
                      'evaluation',
                      'evaluationFeedback',
                      'hallucinationScore',
                      'hallucinationFeedback',
                      'testType',
                    ].map((key) => (
                      <td
                        key={key}
                        className='border px-4 py-2 max-w-[50px] truncate relative cursor-pointer hover:bg-blue-100 transition-all duration-200'
                        onClick={() =>
                          setSelectedCell(
                            selectedCell === `metric-${index}-${key}`
                              ? null
                              : `metric-${index}-${key}`
                          )
                        }
                      >
                        <span className='truncate block'>
                          {typeof metric[key as keyof Metric] === 'number'
                            ? (metric[key as keyof Metric] as number).toFixed(2)
                            : metric[key as keyof Metric]}
                        </span>

                        {selectedCell === `metric-${index}-${key}` && (
                          <div
                            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 h-full w-full'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className='bg-white text-black p-6 rounded-lg shadow-lg max-w-[800px] max-h-[80vh] overflow-y-auto m-4'>
                              <div className='flex justify-between items-start mb-4'>
                                <h3 className='font-bold text-lg'>
                                  {key
                                    .replace(/([A-Z])/g, ' $1')
                                    .replace(/^./, (str) => str.toUpperCase())}
                                </h3>
                                <button
                                  onClick={() => setSelectedCell(null)}
                                  className='text-gray-500 hover:text-gray-700'
                                >
                                  ✕
                                </button>
                              </div>
                              <div className='whitespace-pre-wrap'>
                                {typeof metric[key as keyof Metric] === 'number'
                                  ? (
                                      metric[key as keyof Metric] as number
                                    ).toFixed(2)
                                  : metric[key as keyof Metric]}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* section: Table */}
        {isLoading && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 min-h-screen w-full'>
            <div className='animate-spin rounded-full h-32 w-32 border-t-8 border-b-8 border-blue-500'></div>
          </div>
        )}
        {evaluationResults.length > 0 && (
          <div className='w-full max-w-7xl overflow-x-auto mt-8'>
            <table className='min-w-fit bg-white rounded-lg text-black text-xs'>
              <thead className='bg-gray-100'>
                <tr>
                  <th className='w-[85px] px-1 py-1 text-xs'>Model Name</th>
                  <th className='w-[85px] px-1 py-1 text-xs'>Model Type</th>
                  <th className='w-[85px] px-1 py-1 text-xs'>Model Provider</th>
                  <th className='w-[85px] px-1 py-1 text-xs'>
                    Relevance Score
                  </th>
                  <th className='w-[85px] px-1 py-1 text-xs'>Accuracy Score</th>
                  <th className='w-[85px] px-1 py-1 text-xs'>Clarity Score</th>
                  <th className='w-[85px] px-1 py-1 text-xs'>
                    Coherence Score
                  </th>
                  <th className='w-[85px] px-1 py-1 text-xs'>
                    Creativity Score
                  </th>
                  <th className='w-[85px] px-1 py-1 text-xs'>
                    Alignment Score
                  </th>
                  <th className='w-[85px] px-1 py-1 text-xs'>
                    Evaluation Score
                  </th>
                  <th className='w-[85px] px-1 py-1 text-xs'>Evaluation</th>
                  <th className='w-[85px] px-1 py-1 text-xs'>
                    Evaluation Feedback
                  </th>
                  <th className='w-[85px] px-1 py-1 text-xs'>
                    Hallucination Score
                  </th>
                  <th className='w-[85px] px-1 py-1 text-xs'>
                    Hallucination Feedback
                  </th>
                  <th className='w-[85px] px-1 py-1 text-xs'>Test Type</th>
                </tr>
              </thead>
              <tbody>
                {evaluationResults.map(
                  (metric: EvaluationResponse, index: number) => (
                    <tr key={index}>
                      {[
                        'modelName',
                        'modelType',
                        'modelProvider',
                        'relevanceScore',
                        'accuracyScore',
                        'clarityScore',
                        'coherenceScore',
                        'creativityScore',
                        'alignmentScore',
                        'evaluationScore',
                        'evaluation',
                        'evaluationFeedback',
                        'hallucinationScore',
                        'hallucinationFeedback',
                        'testType',
                      ].map((key) => (
                        <td
                          key={key}
                          className='border px-4 py-2 max-w-[50px] truncate relative cursor-pointer hover:bg-blue-100 transition-all duration-200'
                          onClick={() =>
                            setSelectedCell(
                              selectedCell === `metric-${index}-${key}`
                                ? null
                                : `metric-${index}-${key}`
                            )
                          }
                        >
                          <span className='truncate block'>
                            {typeof metric[key as keyof EvaluationResponse] ===
                            'number'
                              ? (
                                  metric[
                                    key as keyof EvaluationResponse
                                  ] as number
                                ).toFixed(2)
                              : metric[key as keyof EvaluationResponse]}
                          </span>

                          {selectedCell === `metric-${index}-${key}` && (
                            <div
                              className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 h-full w-full'
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className='bg-white text-black p-6 rounded-lg shadow-lg max-w-[800px] max-h-[80vh] overflow-y-auto m-4'>
                                <div className='flex justify-between items-start mb-4'>
                                  <h3 className='font-bold text-lg'>
                                    {key
                                      .replace(/([A-Z])/g, ' $1')
                                      .replace(/^./, (str) =>
                                        str.toUpperCase()
                                      )}
                                  </h3>
                                  <button
                                    onClick={() => setSelectedCell(null)}
                                    className='text-gray-500 hover:text-gray-700'
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div className='whitespace-pre-wrap'>
                                  {typeof metric[
                                    key as keyof EvaluationResponse
                                  ] === 'number'
                                    ? (
                                        metric[
                                          key as keyof EvaluationResponse
                                        ] as number
                                      ).toFixed(2)
                                    : metric[key as keyof EvaluationResponse]}
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
