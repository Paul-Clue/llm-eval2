// import { NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server";
import { searchSimilar } from '../../../../../services/embedding'

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { systemPrompt, userPrompt, expectedOutput, model, document } = await req.json()
    
    const encoder = new TextEncoder();

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    (async () => {
      try {
        const results = await searchSimilar(
          systemPrompt,
          userPrompt,
          expectedOutput,
          model,
          document,
          userId,
          
          async (chunk: string) => {
            await writer.write(encoder.encode(chunk));
          }
        );

        await writer.write(encoder.encode('\n\nFINAL_RESULTS:' + JSON.stringify({ result: results })));
      } catch (error) {
        console.error('Error:', error);
        await writer.write(encoder.encode(`\nError: ${error}`));
      } finally {
        await writer.close();
      }
    })();

    // const results = await searchSimilar(
    //   systemPrompt,
    //   userPrompt,
    //   expectedOutput,
    //   model,
    //   document,
    //   userId,
    // )

    // if (results === "no document found.") {
    //   return NextResponse.json({
    //     detail: "Please upload a document to search.",
    //     result: null
    //   })
    //   // throw new Error('No search results found')
    // }

    // return NextResponse.json({
    //   detail: "Search completed successfully",
    //   result: results
    // })
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked'
      }
    });

  } catch (error) {
    console.error('Error in API route:', error);
    return Response.json({
      detail: `Error: ${error}`,
      result: null
    }, { status: 500 });
  }
}