import { Readable } from "node:stream";

import { env } from "./env.js";

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

/**
 * Gets a response from the OpenRouter API.
 *
 * @param {{ role: string, content: string }[]} messages
 * @param {boolean} [stream=true] - Whether to stream the response or not, defaults to `true`
 *
 * @returns {Promise<string | Readable>} - Returns a `Promise` resolving to a string when `stream` is `false`,
 *                                         and a `Readable` when `stream` is `true`.
 */
async function getResponse(messages, stream = true) {
  const response = await fetch(GROQ_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      stream,
      messages,
    }),
  });

  if (!response.ok) {
    const errMsg = (await response.text()).slice(0, 100);
    console.error(response.status, errMsg);
    throw new Error("Network response was not ok");
  }

  if (!stream) {
    const data = await response.json();
    return data.choices[0].message.content;
  }

  return Readable.from(response.body);
}

/**
 * Gets an AI answer for the given query.
 *
 * @param {string} query
 * @param {string} searchResults
 * @param {boolean} [stream=true] - Whether to stream the response or not, defaults to `true`
 *
 */
export async function getAiAnswer(query, searchResults, stream = true) {
  const messages = [
    {
      role: "system",
      content: systemPromptWithSearchResults(searchResults),
    },
    {
      role: "user",
      content: query,
    },
  ];

  return getResponse(messages, stream);
}

const SP_SEARCH_RESULTS = `You are an AI assistant providing answers based on search results.

CRITICAL RULE:
- You can ONLY cite numbers that match the exact search result numbers (1-5 if there are 5 results)
- Citations MUST use format: [N](url) where N is the search result number
- NEVER cite numbers higher than the total number of provided search results

FORMAT:
1. MUST cite every fact with corresponding search result number
2. Example format: "The Earth orbits the Sun [1](url1). This takes 365 days [2](url2)."
3. If unsure about source number, DO NOT cite

For insufficient/no results:
"The search results don't contain enough information to answer this query."

Remember: Only use citation numbers that match actual search result numbers.`;

/**
 *
 * @param {string} searchResults
 * @returns
 */
function systemPromptWithSearchResults(searchResults) {
  return `${SP_SEARCH_RESULTS}
  
Search results:
${searchResults.slice(0, 6000)}`;
}

const SP_SEARCH_QUERY = `Intelligently convert user's message into a Google search query
that will get the most relevant results.

- Match human Google search patterns
- Return only the search query
- No explanations or context
- Don't wrap the query in quotes

Example:
User: What is the capital of France?
Query: capital of France

User: how did vercel start
Query: vercel history
`;

/**
 *
 * @param {string} query
 * @returns
 */
function systemPromptWithSearchQuery(query) {
  return `${SP_SEARCH_QUERY}
  
User's message:
${query}`;
}

export async function getAiSearchQuery(query) {
  const messages = [
    {
      role: "system",
      content: systemPromptWithSearchQuery(query),
    },
  ];

  const response = await getResponse(messages, false);
  if (typeof response !== "string") {
    throw Error("getSearchQuery(): response is unexpectedly not a string");
  }

  return response;
}