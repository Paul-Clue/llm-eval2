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
  
  interface Metric {
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
    hallucinationFeedback: string;
  }