import { useState } from 'react';

export function useUIState() {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('');
  const models = ['mixtral-8x7b-32768', 'gpt-3.5-turbo', 'gemini-1.5-flash'];

  return {
    selectedCell,
    setSelectedCell,
    selectedModel,
    setSelectedModel,
    models,
  };
}