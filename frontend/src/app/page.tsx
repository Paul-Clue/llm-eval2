'use client';

import { useState, FormEvent } from 'react';

export default function Home() {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/groq/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          {
            systemPrompt: systemPrompt,
            userPrompt: userPrompt,
            expectedOutput: expectedOutput,
          }
        ),
      });
      if (!response.ok) {
        const error = await response.json()
        console.error('API Error:', error) 
        return
      }
      const data = await response.json();
      console.log("Response:", data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className='grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
      <div className='flex flex-col gap-4 mt-20'>
        <h1>Hello World</h1>
        <form onSubmit={handleSubmit} className='flex flex-col gap-4 text-black'>
          <label className='text-white' htmlFor='systemprompt'>System Prompt</label>
          <input
          type='text'
          id='systemprompt'
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          />
          <label className='text-white' htmlFor='userprompt'>User Prompt</label>
          <input
          type='text'
          id='userprompt'
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          />
          <label className='text-white' htmlFor='expectedoutput'>Expected Output</label>
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
        </form>
      </div>
    </div>
  );
}
