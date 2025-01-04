import { useState } from 'react';
import type { EvaluationResponse } from '../types/ui';

export function useApi() {
  
  const [isLoading, setIsLoading] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<
    EvaluationResponse[]
  >([]);
  const [streamingContent, setStreamingContent] = useState({
    mixtral: '',
    gpt: '',
    gemini: '',
    single: ''
  });

  const fetchMetrics = async (model?: string) => {
    try {
      const url = model
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/models/metrics?model=${model}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/api/models/metrics`;
      const response = await fetch(url);
      const data = await response.json();
      setEvaluationResults(data.result);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const handleSubmit = async (formData: {
    systemPrompt: string;
    userPrompt: string;
    expectedOutput: string;
    model: string;
    documentTest: boolean;
  }) => {
    setIsLoading(true);
    setStreamingContent({
      mixtral: '',
      gpt: '',
      gemini: '',
      single: ''
    });

    try {
      console.log('Form data:', formData);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/models/search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(errorData);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const text = new TextDecoder().decode(value);
        
        if (formData.model === 'all') {
          if (text.includes('MixtralContent')) {
            const content = text.replace('MixtralContent', '');
            setStreamingContent(prev => ({
              ...prev,
              mixtral: prev.mixtral + content
            }));
          } else if (text.includes('GPTContent')) {
            const content = text.replace('GPTContent', '');
            setStreamingContent(prev => ({
              ...prev,
              gpt: prev.gpt + content
            }));
          } else if (text.includes('GeminiContent')) {
            const content = text.replace('GeminiContent', '');
            setStreamingContent(prev => ({
              ...prev,
              gemini: prev.gemini + content
            }));
          }
        } else {
          setStreamingContent(prev => ({
            ...prev,
            single: prev.single + text
          }));
        }

        if (text.includes('FINAL_RESULTS:')) {
          const [, resultsStr] = text.split('FINAL_RESULTS:');
          const { result } = JSON.parse(resultsStr);
          if (result) {
            await fetchMetrics();
          }
        }
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setStreamingContent(prev => ({
        ...prev,
        single: `Error: ${error}`
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    setIsLoading,
    evaluationResults,
    setEvaluationResults,
    fetchMetrics,
    handleSubmit,
    streamingContent,
  };
}
