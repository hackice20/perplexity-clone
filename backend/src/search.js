import jsdom, { JSDOM } from "jsdom";

import { env } from "./env.js";
import { getAiSearchQuery } from "./ai.js";

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", () => {
  // No-op to skip console errors.
});

const SEARCH_API = "https://www.googleapis.com/customsearch/v1";

/**
 * @typedef {Object} SearchResult
 * @property {string} title - Title of the source.
 * @property {string} link - Link to the source.
 * @property {string} snippet - Snippet of the source.
 * @property {string} displayLink - Display link of the source.
 * @property {string | null} image - Image URL of the source.
 */

/**
 * Searches Google Custom Search API for the given query.
 *
 * @param {string} query
 * @return {Promise<SearchResult[]>}
 */
export async function search(query) {
  query = await getAiSearchQuery(query);
  console.log(`log google search query: '${query}'`);

  const url = new URL(SEARCH_API);
  url.searchParams.append("key", env.GOOGLE_API_KEY);
  url.searchParams.append("cx", env.GOOGLE_SEARCH_ENGINE_ID);
  url.searchParams.append("q", query);
  url.searchParams.append("num", "5");

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errMsg = (await res.text()).slice(0, 100);
    console.error(response.status, errMsg);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data.items)) {
    return [];
  }

  return data.items.map((result) => ({
    title: result.title,
    link: result.link,
    snippet: result.snippet,
    displayLink: result.displayLink,
    image:
      result.pagemap?.metatags?.length && "og:image" in result.pagemap.metatags[0]
        ? result.pagemap.metatags[0]["og:image"]
        : null,
  }));
}

/**
 * @typedef {SearchResult & {text: string}} SearchResultWithContent
 */

/**
 * Fetches the text content from an array of URLs concurrently.
 * @param {SearchResult[]} results - Array of search results to fetch the texts from.
 * @returns {Promise<SearchResultWithContent[]>}
 */
export async function fetchFromSearchResults(results) {
  const fetchPromises = results.map(async (source) => {
    let text = "";
    try {
      const response = await fetch(source.link, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType) {
        return { ...source, text };
      } else if (contentType.includes("application/json")) {
        text = await response.json();
      } else if (contentType.includes("text/html")) {
        const html = await response.text();
        const dom = new JSDOM(html, { virtualConsole });
        const body = dom.window.document.body;

        // delete unnecessary tags from the body
        body.querySelectorAll("script,style,noscript").forEach((el) => el.remove());

        text = body.textContent?.replace(/\s+/g, " ").trim() ?? "";
      } else if (contentType.includes("text/plain") || contentType.includes("application/xml")) {
        text = await response.text();
      }
    } catch (error) {
      console.error(`Error fetching text from ${source.link}:`, error);
    }

    return { ...source, text };
  });

  return await Promise.all(fetchPromises);
}