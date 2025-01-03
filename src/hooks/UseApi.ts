import { useState } from 'react';
import type { EvaluationResponse } from '../types/ui';

export function useApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResponse[]>([]);

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
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/models/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: formData.systemPrompt,
          userPrompt: formData.userPrompt,
          expectedOutput: formData.expectedOutput,
          model: formData.testModel,
          document: formData.documentTest,
        }),
      });

      const data = await response.json();
      if (!data.result) {
        alert(data.detail);
        return;
      }
      await fetchMetrics();
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
  };
}