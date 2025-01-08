'use client';

import { useState, useEffect, FormEvent } from 'react';
import type { Metric } from '../types/ui.d.ts';
import { useFormState } from '../hooks/useFormState';
import { useApi } from '../hooks/UseApi';
import { useUIState } from '../hooks/useUIState';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { SelectedModel } from '../components/SelectedModel';
import { EvaluationResults } from '../components/EvaluationResults';

export default function Home() {
  const modelResponseClasses = 'w-1/3 border-4 rounded-lg border-blue-500 shadow-md shadow-blue-500/50 hover:shadow-xl transition-shadow duration-300';
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
    isLoading,
    setIsLoading,
    evaluationResults,
    setEvaluationResults,
    handleSubmit: submitApi,
    streamingContent,
  } = useApi();

  const {
    selectedModel,
    setSelectedModel,
    models,
  } = useUIState();

  useEffect(() => {
    fetchMetrics(selectedModel);
  }, [selectedModel]);

  const [metrics, setMetrics] = useState<Metric[]>([]);

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
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/models/metrics`
        );
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        if (data.message) {
          setEvaluationResults([]);
          return;
        }
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
    if (!testModel) {
      alert("Please choose a model to test.")
      return
    }
    console.log('Form submitted');
    
    try {
      await submitApi({
        systemPrompt,
        userPrompt,
        expectedOutput,
        model:testModel,
        documentTest,
      });
      console.log('API call completed');
      resetForm();
    } catch (error) {
      console.error('Error in form submission:', error);
    }
  };

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
        <div className='flex flex-row w-full justify-end gap-4'>
          <SignedOut>
            {/* <SignInButton /> */}
            <SignInButton >
              <button className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md'>
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
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
                <option value='all'>All Models</option>
                <option value='mixtral-8x7b-32768'>Mixtral-8x7b</option>
                <option value='gpt-3.5-turbo'>GPT-3.5</option>
                <option value='llama-3.3-70b-versatile'>llama-3.3-70b-versatile</option>
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

        {testModel !== 'all' && streamingContent.single ? (
          // Single model view
          <div className={modelResponseClasses}>
            <div className='bg-white rounded-lg p-6 text-black text-xs'>
              <h3 className='mb-2'>
                <span className='font-bold'>{testModel}</span> <br /> Response:
              </h3>
              <div className='whitespace-pre-wrap'>
                {streamingContent.single}
              </div>
            </div>
          </div>
        ) : (
          <div className='flex flex-row gap-4 justify-between w-full max-w-7xl mt-8'>
            {streamingContent.mixtral && (
              <div className={modelResponseClasses}>
                <div className='h-[50vh] overflow-y-auto bg-white rounded-lg p-6 text-black text-xs'>
                  <h3 className='mb-2'>
                    <span className='font-bold'>Mixtral-8x7b</span> <br />{' '}
                    Response:
                  </h3>
                  <div className='whitespace-pre-wrap'>
                    {streamingContent.mixtral}
                  </div>
                </div>
              </div>
            )}
            {streamingContent.gpt && (
              <div className={modelResponseClasses}>
                <div className='h-[50vh] overflow-y-auto bg-white rounded-lg p-6 text-black text-xs'>
                  <h3 className='mb-2'>
                    <span className='font-bold'>GPT-3.5</span> <br /> Response:
                  </h3>
                  <div className='whitespace-pre-wrap'>
                    {streamingContent.gpt}
                  </div>
                </div>
              </div>
            )}
            {streamingContent.llama && (
              <div className={modelResponseClasses}>
                <div className='h-[50vh] overflow-y-auto bg-white rounded-lg p-6 text-black text-xs'>
                  <h3 className='mb-2'>
                    <span className='font-bold'>llama</span> <br /> Response:
                  </h3>
                  <div className='whitespace-pre-wrap'>
                    {streamingContent.llama}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <SelectedModel metrics={metrics} selectedModel={selectedModel} />

        {/* section: Table */}
        {isLoading && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 min-h-screen w-full'>
            <div className='animate-spin rounded-full h-32 w-32 border-t-8 border-b-8 border-blue-500'></div>
          </div>
        )}
        <EvaluationResults evaluationResults={evaluationResults} />
      </div>
    </div>
  );
}
