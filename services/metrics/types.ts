export interface Metrics {
  modelName: string
  modelProvider: string
  systemPrompt: string
  userPrompt: string
  response: string
  modelType: string
  modelVersion: string
  modelConfig: string
  expectedOutput?: string
  relevanceScore?: number
  accuracyScore?: number
  clarityScore?: number
  coherenceScore?: number
  creativityScore?: number
  alignmentScore?: number
  evaluation?: string
  evaluationScore?: number
  evaluationFeedback?: string
  hallucinationScore?: number
  hallucinationFeedback?: string
  testType?: string
}