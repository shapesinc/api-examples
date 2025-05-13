import { NextRequest, NextResponse } from 'next/server';

const shapesApiKey = process.env.SHAPESINC_API_KEY;
const shapeUsername = process.env.SHAPESINC_SHAPE_USERNAME;

if (!shapesApiKey || !shapeUsername) {
  console.error("Shapes API key or username not configured in .env.local. This will cause errors at runtime.");
  // Note: In a production app, you might want to halt the server or provide a more explicit error during startup
}

interface SearchLink {
  title: string;
  url: string;
  snippet?: string;
}

interface DuckDuckGoResult {
  contextText: string;
  links: SearchLink[];
}

async function getDuckDuckGoResults(query: string): Promise<DuckDuckGoResult> {
  console.log(`Workspaceing DuckDuckGo results for: ${query}`);
  try {
    // Added a timeout option just in case the DDG API hangs, though fetch doesn't directly support it.
    // A more robust solution might involve AbortController or a library.
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&t=shapesinc-shape-search`, {
       // You might add timeout logic here if needed, using AbortController
    });

    if (!response.ok) {
      console.error(`DuckDuckGo API error: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error('DuckDuckGo error body:', errorBody);
      // Return a specific error message for the context
      return {
        contextText: `Error fetching search results from DuckDuckGo for "${query}". Status: ${response.status}. Details: ${response.statusText}`,
        links: []
      };
    }

    const data = await response.json();

    let contextText = "";
    const links: SearchLink[] = [];

    // Primary context
    // Prefer AbstractText if available, then Definition
    if (data.AbstractText) {
      contextText += data.AbstractText; // No need for extra newlines if adding links later
      if (data.AbstractURL) { // Check if URL exists before adding as a link
         const abstractTitle = data.Heading || query; // Use Heading as title if available, otherwise query
         // Add the main abstract as a link if URL exists and it's not already in links
         if (!links.find(link => link.url === data.AbstractURL)) {
             links.push({
                 title: `Abstract: ${abstractTitle}`,
                 url: data.AbstractURL,
                 snippet: data.AbstractText ? data.AbstractText.substring(0, 180) + (data.AbstractText.length > 180 ? "..." : "") : undefined // Truncate snippet
             });
         }
      }
    } else if (data.Definition) {
        contextText += data.Definition; // No need for extra newlines
         if (data.DefinitionURL) { // Check if URL exists
            if (!links.find(link => link.url === data.DefinitionURL)) {
                links.push({
                    title: `Definition: ${query}`,
                    url: data.DefinitionURL,
                    snippet: data.Definition ? data.Definition.substring(0, 180) + (data.Definition.length > 180 ? "..." : "") : undefined // Truncate snippet
                });
            }
        }
    }

    // Extract links from Results array (more direct search results)
    // Increased from slice(0, 3) to slice(0, 5) - Adjust as needed
    const MAX_RESULTS_LINKS = 10;
    if (data.Results && Array.isArray(data.Results)) {
        data.Results.slice(0, MAX_RESULTS_LINKS).forEach((item: any) => {
            // Ensure it has URL and text, and is not already added
            if (item.FirstURL && item.Text && !links.find(link => link.url === item.FirstURL)) {
                 // Attempt to extract snippet, cleaning HTML tags
                 const snippet = item.Result
                    ? item.Result.replace(/<[^>]*>?/gm, '').replace(item.Text, '').trim() // Remove text from snippet if present
                    : undefined;
                 links.push({
                     title: item.Text,
                     url: item.FirstURL,
                     snippet: snippet ? snippet.substring(0, 180) + (snippet.length > 180 ? "..." : "") : undefined // Truncate snippet
                 });
            }
        });
    }

    // Extract links from RelatedTopics (broader topics)
    // Increased overall link limit from 7 to 15 - Adjust as needed
    const OVERALL_MAX_LINKS = 25;
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        if (links.length >= OVERALL_MAX_LINKS) break; // Stop if we reach the overall limit

        // Ensure it's a result topic with a URL and text, not a category group ('Topics'), and not already added
        if (topic.FirstURL && topic.Text && !topic.Topics && !links.find(link => link.url === topic.FirstURL)) {
           const snippet = topic.Result
              ? topic.Result.replace(/<[^>]*>?/gm, '').replace(topic.Text, '').trim()
              : undefined;
           links.push({
               title: topic.Text,
               url: topic.FirstURL,
               snippet: snippet ? snippet.substring(0, 180) + (snippet.length > 180 ? "..." : "") : undefined // Truncate snippet
            });
        }
      }
    }

    // Fallback context if primary ones are empty, prioritize Answer field
    if (!contextText && data.Answer && typeof data.Answer === 'string') {
        contextText = data.Answer;
    } else if (!contextText && data.AbstractSource && data.AbstractSource.Text) {
         // Use the source text as a fallback if no abstract/definition
         contextText = `Information from ${data.AbstractSource.Text}: ${data.Abstract}`; // Combine source and abstract text if available
    }


    // Add snippets from the gathered links to the context if the context is short
    if (links.length > 0 && contextText.length < 1000) { // Added a check to not append to very long context
        const linksContext = links.slice(0, Math.max(3, MAX_RESULTS_LINKS)).map(link => { // Take snippets from a few primary links
            if(link.snippet && link.title) return `- ${link.title}: ${link.snippet}`;
            if(link.snippet) return `- ${link.snippet}`;
            if(link.title) return `- ${link.title}`;
            return null; // Skip if no title or snippet
        }).filter(item => item !== null).join('\n');

        if (linksContext) {
             if (contextText) {
                contextText += "\n\nRelated information snippets:\n" + linksContext;
             } else {
                contextText = "Information snippets:\n" + linksContext;
             }
        }
    }

    // Final check and fallback message
    if (!contextText && links.length === 0) {
      contextText = `No direct information or related links found for "${query}" on DuckDuckGo. Try rephrasing your query.`;
    } else if (!contextText && links.length > 0) {
      // If no primary context but links were found
      contextText = `Found related links for "${query}", but no direct summary text from DuckDuckGo. The AI will try to summarize based on link snippets if available.`;
    }


    // Truncate the final context text to avoid excessively long prompts for the AI
    const MAX_CONTEXT_LENGTH = 3000; // Adjusted max context length
    const finalContext = contextText.substring(0, MAX_CONTEXT_LENGTH);
    if (contextText.length > MAX_CONTEXT_LENGTH) {
        // Ensure we don't cut in the middle of a word or sentence ideally
        const lastSpace = finalContext.lastIndexOf(' ');
        finalContext.substring(0, lastSpace > 0 ? lastSpace : MAX_CONTEXT_LENGTH) + "...";
    }


    return { contextText: finalContext, links };

  } catch (error) {
    console.error('Error fetching from DuckDuckGo API:', error);
    // Return a more informative error for the context if the fetch fails entirely
    return {
      contextText: `Failed to fetch search results for "${query}" due to an internal error: ${error instanceof Error ? error.message : String(error)}.`,
      links: []
    };
  }
}

export async function POST(req: NextRequest) {
  if (!shapesApiKey || !shapeUsername) {
    // Return a more explicit error to the frontend if keys are missing
    return NextResponse.json({
        error: 'Server configuration error: Shapes API credentials are not set up.',
        links: [],
        searchContext: "API configuration is incomplete." // Provide context even for config error
    }, { status: 500 });
  }

  try {
    const { query, userId, channelId } = await req.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required and must be a non-empty string.', links: [], searchContext: "" }, { status: 400 });
    }
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'User ID is required for Shapes API.', links: [], searchContext: "" }, { status: 400 });
    }
    if (!channelId || typeof channelId !== 'string') {
        return NextResponse.json({ error: 'Channel ID is required for Shapes API.', links: [], searchContext: "" }, { status: 400 });
    }

    const ddgResults = await getDuckDuckGoResults(query);

    // Modify prompt slightly to better handle cases with minimal context
    const prompt = `Based on the following search context for "${query}", provide a concise and informative summary or answer. Focus on the key information. If the context indicates no information was found or is insufficient, clearly state that. Avoid making up information. Search context:\n\n${ddgResults.contextText || "No specific context found."}`; // Add a default if context is empty

    console.log("Sending prompt to Shapes API. Context length:", ddgResults.contextText.length); // Log context length

    const shapesApiResponse = await fetch('https://api.shapes.inc/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${shapesApiKey}`,
            'Content-Type': 'application/json',
            // Ensure User-Id and Channel-Id are passed for tracking/billing
            'X-User-Id': userId,
            'X-Channel-Id': channelId,
        },
        body: JSON.stringify({
            model: `shapesinc/${shapeUsername}`, // Make sure this matches your model identifier
            messages: [{ role: 'user', content: prompt }],
            // Optional: Add parameters like temperature, max_tokens if supported by Shapes API
            // temperature: 0.7,
            // max_tokens: 500,
        }),
        // Optional: Add a timeout for the Shapes API call as well
    });

    if (!shapesApiResponse.ok) {
        const errorBody = await shapesApiResponse.text();
        console.error(`Shapes API error: ${shapesApiResponse.status} ${shapesApiResponse.statusText}`, errorBody);
        // Include DDG links and context even on Shapes API error
        return NextResponse.json({
            error: `AI summary request failed: ${shapesApiResponse.statusText}. Details: ${errorBody}`,
            links: ddgResults.links,
            searchContext: ddgResults.contextText // Include search context in error response
        }, { status: shapesApiResponse.status });
    }

    const shapesData = await shapesApiResponse.json();
    // Assuming the structure { choices: [ { message: { content: "..." } } ] }
    const aiSummary = shapesData.choices?.[0]?.message?.content || 'The AI did not provide a summary for this query.';

    // Return the AI summary and the links obtained from DuckDuckGo
    return NextResponse.json({
        summary: aiSummary,
        links: ddgResults.links,
        searchContext: ddgResults.contextText // Optional: return context for debugging/logging
    });

  } catch (error: any) {
    console.error('Error in /api/search handler:', error);
    // Catch any unexpected errors during the process
    return NextResponse.json({
        error: 'An unexpected error occurred while processing your request.',
        details: error.message || 'Unknown error',
        links: [], // Ensure links is always an array
        searchContext: "" // Ensure context is always a string
    }, { status: 500 });
  }
}
