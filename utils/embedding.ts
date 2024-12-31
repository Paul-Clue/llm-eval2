import { Pinecone } from '@pinecone-database/pinecone'
import { OpenAI } from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Groq } from 'groq-sdk'
import { prisma } from './db'

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

export class EmbeddingService {
  private index
  private namespace

  constructor() {
    this.index = pinecone.index(process.env.PINECONE_INDEX!)
    this.namespace = process.env.PINECONE_NAMESPACE || 'default'
  }

  async embedAndStore(text: string, metadata: any = {}) {
    try {
      // Use OpenAI for embeddings instead of sentence-transformers
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      })

      await this.index.upsert({
        vectors: [{
          id: metadata.id || 'default-id',
          values: embedding.data[0].embedding,
          metadata
        }],
        namespace: this.namespace
      })

      return true
    } catch (error) {
      console.error('Error in embedAndStore:', error)
      return false
    }
  }

  async searchSimilar(systemPrompt: string, userPrompt: string, expectedOutput: string, model: string) {
    try {
      // Get embedding for search
      const queryEmbedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: userPrompt,
      })

      // Search Pinecone
      const searchResults = await this.index.query({
        vector: queryEmbedding.data[0].embedding,
        topK: 5,
        namespace: this.namespace,
        includeMetadata: true
      })

      if (!searchResults.matches?.length) {
        return null
      }

      // Build context from matches
      const context = searchResults.matches
        .map(match => `Document (score: ${match.score}): ${match.metadata?.text}`)
        .join('\n')

      // Generate response based on model
      const newSystemPrompt = `
        ${systemPrompt}
        
        Please use the following context to inform your response:
        ${context}
        
        Please think step by step to provide an accurate response.
      `

      let content: string | null = null

      switch (model) {
        case "mixtral-8x7b-32768":
          const groqResponse = await groq.chat.completions.create({
            messages: [
              { role: "system", content: newSystemPrompt },
              { role: "user", content: userPrompt }
            ],
            model: "mixtral-8x7b-32768"
          })
          content = groqResponse.choices[0]?.message?.content || null
          break

        case "gpt-3.5-turbo":
          const openaiResponse = await openai.chat.completions.create({
            messages: [
              { role: "system", content: newSystemPrompt },
              { role: "user", content: userPrompt }
            ],
            model: "gpt-3.5-turbo"
          })
          content = openaiResponse.choices[0]?.message?.content || null
          break

        case "gemini-1.5-flash":
          const model = genai.getGenerativeModel({ model: "gemini-1.5-pro" })
          const geminiResponse = await model.generateContent([newSystemPrompt, userPrompt])
          const geminiResult = await geminiResponse.response
          content = geminiResult.text() || null
          break
      }

      if (!content) {
        throw new Error("No response from model")
      }

      // Evaluate response using GPT-4
      const evaluationPrompt = `
        You are a helpful assistant that evaluates the response of a model.
        You will be given a user prompt, a system prompt, and an expected output.
        You will then evaluate the model response, paying special attention to hallucinations.

        User Prompt: ${userPrompt}
        System Prompt: ${systemPrompt}
        Expected Output: ${expectedOutput}
        Model Response: ${content}

        Carefully analyze the response for:
        1. Factual accuracy compared to the expected output
        2. Information fabrication or hallucinations
        3. Claims made without basis in the input prompts
        4. Consistency with the given context

        Return your evaluation in the following JSON format:
        {
          "relevanceScore": <float 0-1>,
          "accuracyScore": <float 0-1>,
          "clarityScore": <float 0-1>,
          "coherenceScore": <float 0-1>,
          "creativityScore": <float 0-1>,
          "alignmentScore": <float 0-1>,
          "hallucinationScore": <float 0-1>,
          "evaluation": "<detailed evaluation text>",
          "evaluationScore": <float 0-1>,
          "evaluationFeedback": "<specific feedback and suggestions>",
          "hallucinationFeedback": "<specific examples of any hallucinations found. If none, return 'None'>"
        }
      `

      const evaluationResponse = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: evaluationPrompt },
          { role: "user", content: content }
        ],
        response_format: { type: "json_object" }
      })

      const evaluationContent = evaluationResponse.choices[0]?.message?.content
      if (!evaluationContent) {
        throw new Error("No evaluation response")
      }

      const scores = JSON.parse(evaluationContent)

      // Save metrics to database
      await prisma.evaluation_metrics.create({
        data: {
          modelName: model,
          modelProvider: this.getModelProvider(model),
          systemPrompt,
          userPrompt,
          response: content,
          modelType: "chat",
          modelVersion: "1.0",
          modelConfig: "default",
          expectedOutput,
          ...scores
        }
      })

      return evaluationContent

    } catch (error) {
      console.error('Error in searchSimilar:', error)
      throw error
    }
  }

  private getModelProvider(model: string): string {
    const providers: Record<string, string> = {
      "mixtral-8x7b-32768": "Groq",
      "gpt-3.5-turbo": "OpenAI",
      "gemini-1.5-flash": "Gemini"
    }
    return providers[model] || "Unknown"
  }
}