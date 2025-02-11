import { useState } from 'react';

export function useUIState() {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('');
  const models = ['mixtral-8x7b-32768', 'gpt-3.5-turbo', 'llama-3.3-70b-versatile'];

  return {
    selectedCell,
    setSelectedCell,
    selectedModel,
    setSelectedModel,
    models,
  };
}