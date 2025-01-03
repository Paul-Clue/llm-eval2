import { useState } from 'react';
import type { EvaluationResponse } from '../types/ui';

export function useApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<
    EvaluationResponse[]
  >([]);
  const [streamingContent, setStreamingContent] = useState<string>('');

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
    testModel: string;
    documentTest: boolean;
  }) => {
    setIsLoading(true);
    setStreamingContent('');
    let finalResults = null;

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/models/search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt: formData.systemPrompt,
            userPrompt: formData.userPrompt,
            expectedOutput: formData.expectedOutput,
            model: formData.testModel,
            document: formData.documentTest,
          }),
        }
      );

      const reader = response.body?.getReader();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = new TextDecoder().decode(value);
          if (text.includes('FINAL_RESULTS:')) {
            const [content, results] = text.split('FINAL_RESULTS:');
            setStreamingContent((prev) => prev + content);
            finalResults = JSON.parse(results);
          } else {
            setStreamingContent((prev) => prev + text);
            await delay(50);
          }
        }
      }

      //   const data = await response.json();
      //   if (!data.result) {
      //     alert(data.detail);
      //     return;
      //   }
      //   await fetchMetrics();
      // } catch (error) {
      //   console.error('Error:', error);
      // } finally {
      //   setIsLoading(false);
      // }
      if (finalResults?.result) {
        await fetchMetrics();
      } else {
        alert('No results received');
      }
    } catch (error) {
      console.error('Error:', error);
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
