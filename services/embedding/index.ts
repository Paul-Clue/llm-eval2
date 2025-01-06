import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';
import { DocumentMetadata, EvaluationResult } from './types';
import { createMetrics } from '../metrics';

const STREAM_DELAY = 30;
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Request timeout')), 50000);
});

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
      // model: 'text-embedding-3-small',
      model: 'text-embedding-ada-002',
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
  document: boolean,
  userId: string,
  onStream?: (chunk: string) => Promise<void>
) {
  let newSystemPrompt: string | null = null;
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  try {
    if (model === 'all') {
      let MixtralContent: string | null = null;
      let GPTContent: string | null = null;
      let GeminiContent: string | null = null;

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
          return 'no document found.';
        }

        // Build context from matches
        const context = searchResults.matches
          .map(
            (match) =>
              `Document (score: ${match.score}): ${match.metadata?.text}`
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

      const groqResponse = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: newSystemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'mixtral-8x7b-32768',
        stream: true,
      });
      // content = groqResponse.choices[0]?.message?.content || null;
      await Promise.race([
        Promise.all([
          streamMixtral(newSystemPrompt, userPrompt, onStream),
          streamGPT(newSystemPrompt, userPrompt, onStream),
          streamGemini(newSystemPrompt, userPrompt, onStream)
        ]),
        timeoutPromise
      ]);

      async function streamMixtral(systemPrompt: string, userPrompt: string, onStream?: (chunk: string) => Promise<void>) {
        const groqResponse = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          model: 'mixtral-8x7b-32768',
          stream: true,
        });
      
        let content = '';
        for await (const chunk of groqResponse) {
          const text = 'MixtralContent' + (chunk.choices[0]?.delta?.content || '');
          if (text && onStream) {
            await delay(STREAM_DELAY);
            await onStream(text);
          }
          content += text.replace('MixtralContent', '');
        }
        return content;
      }
      
      async function streamGPT(systemPrompt: string, userPrompt: string, onStream?: (chunk: string) => Promise<void>) {
        const openaiResponse = await openai.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          model: 'gpt-3.5-turbo',
          stream: true,
        });
      
        let content = '';
        for await (const chunk of openaiResponse) {
          const text = 'GPTContent' + (chunk.choices[0]?.delta?.content || '');
          if (text && onStream) {
            await delay(STREAM_DELAY);
            await onStream(text);
          }
          content += text.replace('GPTContent', '');
        }
        return content;
      }
      
      async function streamGemini(systemPrompt: string, userPrompt: string, onStream?: (chunk: string) => Promise<void>) {
        const geminiModel = genai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const geminiResponse = await geminiModel.generateContentStream([
          systemPrompt,
          userPrompt,
        ]);
      
        let content = '';
        for await (const chunk of geminiResponse.stream) {
          const text = 'GeminiContent' + chunk.text();
          if (text && onStream) {
            await delay(STREAM_DELAY);
            await onStream(text);
          }
          content += text.replace('GeminiContent', '');
        }
        return content;
      }
    
    // async function streamMixtral(systemPrompt: string, userPrompt: string, onStream?: (chunk: string) => Promise<void>) {
    //   const groqResponse = await groq.chat.completions.create({
    //     messages: [
    //       { role: 'system', content: systemPrompt },
    //       { role: 'user', content: userPrompt },
    //     ],
    //     model: 'mixtral-8x7b-32768',
    //     stream: true,
    //   });
    
    //   let content = '';
    //   for await (const chunk of groqResponse) {
    //     const text = 'MixtralContent' + (chunk.choices[0]?.delta?.content || '');
    //     if (text && onStream) {
    //       await delay(STREAM_DELAY);
    //       await onStream(text);
    //     }
    //     content += text.replace('MixtralContent', '');
    //   }
    //   return content;
    // }
      for await (const chunk of groqResponse) {
        const text = 'MixtralContent' + chunk.choices[0]?.delta?.content || '';
        if (text && onStream) {
          await delay(STREAM_DELAY);
          await onStream(text);
        }
        const mixtralText = text.replace('MixtralContent', '');
        MixtralContent = (MixtralContent || '') + mixtralText;
      }

      const openaiResponse = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: newSystemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'gpt-3.5-turbo',
        stream: true,
      });
      // content = openaiResponse.choices[0]?.message?.content || null;
      for await (const chunk of openaiResponse) {
        const text = 'GPTContent' + chunk.choices[0]?.delta?.content || '';
        // if (text && onStream) {
        //   await onStream(text);
        // }
        if (text && onStream) {
          await delay(STREAM_DELAY);
          await onStream(text);
        }
        const gptText = text.replace('GPTContent', '');
        GPTContent = (GPTContent || '') + gptText;
      }

      const geminiModel = genai.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });
      const geminiResponse = await geminiModel.generateContentStream([
        newSystemPrompt,
        userPrompt,
      ]);

      for await (const chunk of geminiResponse.stream) {
        const text = 'GeminiContent' + chunk.text();
        if (text && onStream) {
          await delay(STREAM_DELAY);
          await onStream(text);
        }
        const geminiText = text.replace('GeminiContent', '');
        GeminiContent = (GeminiContent || '') + geminiText;
      }

      if (!MixtralContent || !GPTContent || !GeminiContent) {
        console.log('ALL MODELS: No response from model');
      }

      if (MixtralContent) {
        await evaluateResponse(
          systemPrompt,
          userPrompt,
          expectedOutput,
          MixtralContent,
          'mixtral-8x7b-32768',
          document,
          userId
        );
      }
      if (GPTContent) {
        await evaluateResponse(
          systemPrompt,
          userPrompt,
          expectedOutput,
          GPTContent,
          'gpt-3.5-turbo',
          document,
          userId
        );
      }
      if (GeminiContent) {
        await evaluateResponse(
          systemPrompt,
          userPrompt,
          expectedOutput,
          GeminiContent,
          'gemini-1.5-flash',
          document,
          userId
        );
      }

      return {};
    } else {
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
          return 'no document found.';
        }

        const context = searchResults.matches
          .map(
            (match) =>
              `Document (score: ${match.score}): ${match.metadata?.text}`
          )
          .join('\n');

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
          try {
            const groqResponse = await groq.chat.completions.create({
              messages: [
                { role: 'system', content: newSystemPrompt },
                { role: 'user', content: userPrompt },
              ],
              model: 'mixtral-8x7b-32768',
              stream: true,
            });

            for await (const chunk of groqResponse) {
              const text = chunk.choices[0]?.delta?.content || '';
              if (text && onStream) {
                await delay(STREAM_DELAY);
                await onStream(text);
              }
              content = (content || '') + text;
            }

            if (!content) {
              console.error('No content received from Mixtral model');
              content = 'Model failed to generate a response.';
            }
          } catch (error) {
            console.error('Mixtral model error:', error);
            throw error;
          }
          break;

        case 'gpt-3.5-turbo':
          try {
            const openaiResponse = await openai.chat.completions.create({
              messages: [
                { role: 'system', content: newSystemPrompt },
                { role: 'user', content: userPrompt },
              ],
              model: 'gpt-3.5-turbo',
              stream: true,
            });

            for await (const chunk of openaiResponse) {
              const text = chunk.choices[0]?.delta?.content || '';
              if (text && onStream) {
                await onStream(text);
              }
              content = (content || '') + text;
            }

            if (!content) {
              console.error('No content received from GPT-3.5-turbo model');
              content = 'Model failed to generate a response.';
            }
          } catch (error) {
            console.error('GPT-3.5-turbo model error:', error);
            throw error;
          }
          break;

        case 'gemini-1.5-flash':
          try {
            const geminiModel = genai.getGenerativeModel({
              model: 'gemini-1.5-flash',
            });
            const geminiResponse = await geminiModel.generateContentStream([
              newSystemPrompt,
              userPrompt,
            ]);

            for await (const chunk of geminiResponse.stream) {
              const text = chunk.text();
              if (text && onStream) {
                await onStream(text);
              }
              content = (content || '') + text;
            }

            if (!content) {
              console.error('No content received from Gemini-1.5-flash model');
              content = 'Model failed to generate a response.';
            }
          } catch (error) {
            console.error('Gemini-1.5-flash model error:', error);
            throw error;
          }

          break;
      }

      if (!content) {
        console.error('No content received from any model');
        content = 'All models failed to generate a response.';

        const evaluation = await evaluateResponse(
          systemPrompt,
          userPrompt,
          expectedOutput,
          content,
          model,
          document,
          userId
        );

        return evaluation;
      }

      const evaluation = await evaluateResponse(
        systemPrompt,
        userPrompt,
        expectedOutput,
        content,
        model,
        document,
        userId
      );

      return evaluation;
    }
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
  document: boolean,
  userId: string
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
  const scores = JSON.parse(evaluationContent);

  await createMetrics({
    modelName: model,
    modelProvider: getModelProvider(model),
    systemPrompt: systemPrompt,
    userPrompt: userPrompt,
    modelResponse: content,
    modelType: 'chat',
    modelVersion: '1.0',
    modelConfig: 'default',
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
    testType: document ? 'document' : 'prompt',
    user: {
      connect: {
        id: userId,
      },
    },
  });

  return JSON.parse(evaluationContent);
}

function getModelProvider(model: string): string {
  const providers: Record<string, string> = {
    'mixtral-8x7b-32768': 'Groq',
    'gpt-3.5-turbo': 'OpenAI',
    'gemini-1.5-flash': 'Gemini',
  };
  return providers[model] || 'Unknown';
}
