export interface DocumentMetadata {
  id?: string;
  text?: string;
  type?: string;
  [key: string]: string | number | boolean | null | string[] | undefined;
}

export interface EvaluationResult {
  relevanceScore: number
  accuracyScore: number
  clarityScore: number
  coherenceScore: number
  creativityScore: number
  alignmentScore: number
  hallucinationScore: number
  evaluation: string
  evaluationScore: number
  evaluationFeedback: string
  hallucinationFeedback: string
  userId: string
}
