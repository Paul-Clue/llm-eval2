import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';
// import { prisma } from '../../utils/db'
import { DocumentMetadata, EvaluationResult } from './types';
import { createMetrics } from '../metrics'

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const index = pinecone.index(process.env.PINECONE_INDEX!);

export async function embedAndStore(
  text: string,
  metadata: DocumentMetadata = {}
) {
  try {
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    const result = await index.upsert([
      {
        id: metadata.id || 'default-id',
        values: embedding.data[0].embedding,
        metadata: Object.fromEntries(
          Object.entries(metadata)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [
              k,
              typeof v === 'object' ? JSON.stringify(v) : String(v),
            ])
        ),
      },
    ]);

    // return true
    return { success: true, id: metadata.id || 'default-id', result };
  } catch (error) {
    console.error('Error in embedAndStore:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function searchSimilar(
  systemPrompt: string,
  userPrompt: string,
  expectedOutput: string,
  model: string,
  document: boolean
) {
  let newSystemPrompt: string | null = null;
  try {
    if (document) {
      const queryEmbedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: userPrompt,
      });

      const searchResults = await index.query({
        vector: queryEmbedding.data[0].embedding,
        topK: 5,
        includeMetadata: true,
      });

      if (!searchResults.matches?.length) {
        return null;
      }

      // Build context from matches
      const context = searchResults.matches
        .map(
          (match) => `Document (score: ${match.score}): ${match.metadata?.text}`
        )
        .join('\n');

      // Generate response based on model
      newSystemPrompt = `
      ${systemPrompt}
      
      Please use the following context to inform your response:
      ${context}
      
      Please think step by step to provide an accurate response. If extra information is given by the llm that is in the context, let it be known in your response.
    `;
    } else {
      newSystemPrompt = `
      ${systemPrompt}

      Please think step by step to provide an accurate response.
      `;
    }

    let content: string | null = null;

    switch (model) {
      case 'mixtral-8x7b-32768':
        const groqResponse = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: newSystemPrompt },
            { role: 'user', content: userPrompt },
          ],
          model: 'mixtral-8x7b-32768',
        });
        content = groqResponse.choices[0]?.message?.content || null;
        break;

      case 'gpt-3.5-turbo':
        const openaiResponse = await openai.chat.completions.create({
          messages: [
            { role: 'system', content: newSystemPrompt },
            { role: 'user', content: userPrompt },
          ],
          model: 'gpt-3.5-turbo',
        });
        content = openaiResponse.choices[0]?.message?.content || null;
        break;

      case 'gemini-1.5-flash':
        const geminiModel = genai.getGenerativeModel({
          model: 'gemini-1.5-flash',
        });
        const geminiResponse = await geminiModel.generateContent([
          newSystemPrompt,
          userPrompt,
        ]);
        const geminiResult = await geminiResponse.response;
        content = geminiResult.text() || null;
        break;
    }

    if (!content) {
      throw new Error('No response from model');
    }

    // const evaluation = await evaluateResponse(systemPrompt, userPrompt, expectedOutput, content, model)
    const evaluation = await evaluateResponse(
      systemPrompt,
      userPrompt,
      expectedOutput,
      content,
      model,
      document,
    );

    // await createMetrics({
    //   modelName: model,
    //   modelProvider: getModelProvider(model),
    //   systemPrompt,
    //   userPrompt,
    //   response: content,
    //   modelType: "chat",
    //   modelVersion: "1.0",
    //   modelConfig: "default",
    //   expectedOutput,
    //   ...evaluation,
    //   testType: "document"
    // })

    return evaluation;
  } catch (error) {
    console.error('Error in searchSimilar:', error);
    throw error;
  }
}

// Evaluate response using GPT-4
async function evaluateResponse(
  systemPrompt: string,
  userPrompt: string,
  expectedOutput: string,
  content: string,
  model: string,
  document: boolean
): Promise<EvaluationResult> {
  const evaluationPrompt = `
      You are a fined tuned llm that evaluates the response of llm models.
      You will be given a user prompt, a system prompt, and an expected output.
      You will then evaluate the model response, paying special attention to hallucinations.

      User Prompt: ${userPrompt}
      System Prompt: ${systemPrompt}
      Expected Output: ${expectedOutput}
      Model Response: ${content}

      Carefully analyze the response for:
      1. Factual accuracy compared to the expected output
      2. Information fabrication or hallucinations
      3. Claims made without basis in the input prompts or context
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
    `;

  const evaluationResponse = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: evaluationPrompt },
      { role: 'user', content: content },
    ],
    response_format: { type: 'json_object' },
  });

  const evaluationContent = evaluationResponse.choices[0]?.message?.content;
  if (!evaluationContent) {
    throw new Error('No evaluation response');
  }
  const scores = JSON.parse(evaluationContent)

  await createMetrics({
    modelName: model,
    modelProvider: getModelProvider(model),
    systemPrompt: systemPrompt,
    userPrompt: userPrompt,
    response: content,
    modelType: "chat",
    modelVersion: "1.0",
    modelConfig: "default",
    expectedOutput: expectedOutput,
    relevanceScore: scores.relevanceScore,
    accuracyScore: scores.accuracyScore,
    clarityScore: scores.clarityScore,
    coherenceScore: scores.coherenceScore,
    creativityScore: scores.creativityScore,
    alignmentScore: scores.alignmentScore,
    evaluation: scores.evaluation,
    evaluationScore: scores.evaluationScore,
    evaluationFeedback: scores.evaluationFeedback,
    hallucinationScore: scores.hallucinationScore,
    hallucinationFeedback: scores.hallucinationFeedback,
    testType: document ? "document" : "prompt"
  })

  return JSON.parse(evaluationContent);
}
//   catch (error) {
//     console.error('Error in searchSimilar:', error)
//     throw error
//   }
// }

function getModelProvider(model: string): string {
  const providers: Record<string, string> = {
    "mixtral-8x7b-32768": "Groq",
    "gpt-3.5-turbo": "OpenAI",
    "gemini-1.5-flash": "Gemini"
  }
  return providers[model] || "Unknown"
}
