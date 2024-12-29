'use client';

import { useState, useEffect, FormEvent } from 'react';

interface EvaluationResponse {
  id: string;
  modelName: string;
  modelVersion: string;
  modelType: string;
  modelProvider: string;
  relevanceScore: number;
  accuracyScore: number;
  clarityScore: number;
  coherenceScore: number;
  creativityScore: number;
  alignmentScore: number;
  hallucinationScore: number;
  evaluation: string;
  evaluationScore: number;
  evaluationFeedback: string;
  hallucinationDetails: string;
}

export default function Home() {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('mixtral-8x7b-32768');
  const [isLoading, setIsLoading] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<
    EvaluationResponse[]
  >([]);
  // section: Fetch metrics
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/metrics');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        // setEvaluationResult(data);
        setEvaluationResults(data.result);
        console.log('data', data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);
  console.log('EvaluationResult:', evaluationResults);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/groq/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          expectedOutput,
          model: selectedModel,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        console.error('API Error:', error);
        return;
      }
      const metricsResponse = await fetch('http://localhost:8000/metrics');
      if (!metricsResponse.ok)
        throw new Error('Failed to fetch updated metrics');
      const metricsData = await metricsResponse.json();
      setEvaluationResults(metricsData.result);

      // Clear form inputs
      setSystemPrompt('');
      setUserPrompt('');
      setExpectedOutput('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex flex-col justify-center items-center min-h-screen bg-[#252528] p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)] overflow-x-auto'>
      <div className='flex flex-col gap-4 items-center justify-center'>
        <h1>Hello World</h1>
        {/* section: Form */}
        <form
          onSubmit={handleSubmit}
          className='flex flex-col gap-4 text-black'
        >
          {/* <div className='flex flex-row gap-2'>
            <label className='text-white' htmlFor='modelSelect'>
              Model
            </label>
            <select
              id='modelSelect'
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className='rounded-md px-2 py-1'
            >
              <option value='mixtral-8x7b-32768'>Mixtral-8x7b</option>
              <option value='gpt-3.5-turbo'>GPT-3.5</option>
              <option value='gemini-pro'>Gemini</option>
            </select>
          </div> */}
          <div className='flex flex-row gap-2'>
            <label className='text-white' htmlFor='systemprompt'>
              System Prompt
            </label>
            <input
              type='text'
              id='systemprompt'
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
            <label className='text-white' htmlFor='userprompt'>
              User Prompt
            </label>
            <input
              type='text'
              id='userprompt'
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
            />
            <label className='text-white' htmlFor='expectedoutput'>
              Expected Output
            </label>
            <input
              type='text'
              id='expectedoutput'
              value={expectedOutput}
              onChange={(e) => setExpectedOutput(e.target.value)}
            />
            <button
              className='bg-blue-500 text-white p-2 rounded-md'
              type='submit'
              disabled={isLoading}
            >
              Submit
            </button>
          </div>
          <div className='flex flex-row gap-2'>
            <label className='text-white' htmlFor='modelSelect'>
              Model
            </label>
            <select
              id='modelSelect'
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className='rounded-md px-2 py-1'
            >
              <option value='mixtral-8x7b-32768'>Mixtral-8x7b</option>
              <option value='gpt-3.5-turbo'>GPT-3.5</option>
              <option value='gemini-pro'>Gemini</option>
            </select>
          </div>
        </form>

        {/* section: Table */}
        {evaluationResults.length > 0 && (
          <div className='w-full max-w-4xl mt-8 ml-[-40%]'>
            {isLoading && (
              <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                <div className='animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500'></div>
              </div>
            )}
            <table className='min-w-full bg-white rounded-lg overflow-x-auto text-black'>
              <thead className='bg-gray-100'>
                <tr>
                  {Object.keys(evaluationResults[0])
                    .filter(
                      (key) =>
                        typeof evaluationResults[0][
                          key as keyof EvaluationResponse
                        ] === 'number' ||
                        key === 'modelName' ||
                        key === 'modelProvider' ||
                        key === 'evaluation' ||
                        key === 'evaluationFeedback' ||
                        key === 'hallucinationScore' ||
                        key === 'hallucinationDetails'
                    )
                    .map((key) => (
                      <th key={key} className='px-4 py-2'>
                        {key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (str) => str.toUpperCase())}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {evaluationResults.map((result, index) => (
                  <tr key={index}>
                    {Object.keys(result)
                      .filter(
                        (key) =>
                          typeof result[key as keyof EvaluationResponse] ===
                            'number' ||
                          key === 'modelName' ||
                          key === 'modelProvider' ||
                          key === 'evaluation' ||
                          key === 'evaluationFeedback' ||
                          key === 'hallucinationScore' ||
                          key === 'hallucinationDetails'
                      )
                      .map((key) => (
                        <td
                          key={key}
                          className='border px-4 py-2 max-w-[200px] truncate relative cursor-pointer 
                          hover:border-blue-500 hover:border-2 hover:bg-blue-50 transition-all duration-200'
                          onClick={() =>
                            setSelectedCell(
                              selectedCell === `${index}-${key}`
                                ? null
                                : `${index}-${key}`
                            )
                          }
                        >
                          <span className='truncate block'>
                            {typeof result[key as keyof EvaluationResponse] ===
                            'number'
                              ? (
                                  result[
                                    key as keyof EvaluationResponse
                                  ] as number
                                ).toFixed(2)
                              : result[key as keyof EvaluationResponse]}
                          </span>

                          {/* Popup on click */}
                          {selectedCell === `${index}-${key}` && (
                            <div
                              className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
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
                                  {typeof result[
                                    key as keyof EvaluationResponse
                                  ] === 'number'
                                    ? (
                                        result[
                                          key as keyof EvaluationResponse
                                        ] as number
                                      ).toFixed(2)
                                    : result[key as keyof EvaluationResponse]}
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

            {/* <div className='mt-4 bg-white rounded-lg p-4 text-black'>
              <h3 className='font-bold mb-2'>Evaluation Details</h3>
              <p className='mb-4'>{evaluationResults[0].evaluation}</p>

              <h3 className='font-bold mb-2'>Feedback</h3>
              <p className='mb-4'>{evaluationResults[0].evaluationFeedback}</p>

              <h3 className='font-bold mb-2'>Hallucination Details</h3>
              <p>{evaluationResults[0].hallucinationDetails}</p>
            </div> */}
          </div>
        )}
      </div>
    </div>
  );
}
