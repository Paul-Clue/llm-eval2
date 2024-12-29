'use client';

import { useState, useEffect, FormEvent } from 'react';

interface EvaluationResponse {
  modelName: string;
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
  const [evaluationResult, setEvaluationResult] =
    useState<EvaluationResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/metrics');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setEvaluationResult(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/groq/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: systemPrompt,
          userPrompt: userPrompt,
          expectedOutput: expectedOutput,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        console.error('API Error:', error);
        return;
      }
      const data = await response.json();
      setEvaluationResult(JSON.parse(data.result));
      console.log('Response:', data);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  // section: UI
  return (
    <div className='min-h-screen bg-[#252528] p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
      <div className='flex flex-col gap-4 items-center justify-center'>
        <h1>Hello World</h1>
        <form
          onSubmit={handleSubmit}
          className='flex flex-row gap-4 text-black'
        >
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
          {/* <div className='flex flex-col gap-4'> */}
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
          >
            Submit
          </button>
          {/* </div> */}
        </form>
        {/*  section: Table */}
        {evaluationResult && (
          <div className='w-full max-w-4xl mt-8'>
            <table className='min-w-full bg-white rounded-lg overflow-hidden text-black'>
              <thead className='bg-gray-100'>
                <tr>
                  {Object.keys(evaluationResult as EvaluationResponse)
                    .filter(
                      (key) =>
                        typeof evaluationResult[
                          key as keyof EvaluationResponse
                        ] === 'number' ||
                        key === 'modelName' ||
                        key === 'modelProvider'
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
                <tr>
                  {Object.keys(evaluationResult as EvaluationResponse)
                    .filter(
                      (key) =>
                        typeof evaluationResult[
                          key as keyof EvaluationResponse
                        ] === 'number' ||
                        key === 'modelName' ||
                        key === 'modelProvider'
                    )
                    .map((key) => (
                      <td key={key} className='border px-4 py-2'>
                        {typeof evaluationResult[
                          key as keyof EvaluationResponse
                        ] === 'number'
                          ? (
                              evaluationResult[
                                key as keyof EvaluationResponse
                              ] as number
                            ).toFixed(2)
                          : evaluationResult[key as keyof EvaluationResponse]}
                      </td>
                    ))}
                </tr>
              </tbody>
            </table>

            <div className='mt-4 bg-white rounded-lg p-4 text-black'>
              <h3 className='font-bold mb-2'>Evaluation Details</h3>
              <p className='mb-4'>{evaluationResult.evaluation}</p>

              <h3 className='font-bold mb-2'>Feedback</h3>
              <p className='mb-4'>{evaluationResult.evaluationFeedback}</p>

              <h3 className='font-bold mb-2'>Hallucination Details</h3>
              <p>{evaluationResult.hallucinationDetails}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
