import { Brain } from "lucide-react";
import { useState } from "react";

import SearchInput from "./components/SearchInput";
import SearchResults from "./components/SearchResults";
import FreeTierMessage from "./components/ui/FreeTierMessage";
import LoadingIndicator from "./components/ui/LoadingIndicator";
import { Source } from "./types";

// we only have one endpoint for now so let's keep it simple
const SEARCH_ENDPOINT = "https://perplexity-clone-6te8.onrender.com/search";

function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query) return;
    setSources([]);
    setContent("");
    setIsStreaming(false);
    setIsLoading(true);

    await streamResult(
      query,
      (newContent) => {
        if (isLoading) setIsLoading(false);
        if (!isStreaming) setIsStreaming(true);
        setContent((prev) => prev + newContent);
      },
      setSources
    );

    setIsStreaming(false);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen  text-white">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Brain className="w-8 h-8 text-purple-400" />
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
            AI Search Assistant
          </h1>
        </div>
        <FreeTierMessage />
        <div className="space-y-6">
          <SearchInput onSearch={handleSearch} isLoading={isStreaming || isLoading} />
          {isLoading && <LoadingIndicator />}
          <SearchResults
            sources={sources}
            content={content}
            isStreaming={isStreaming}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

const streamResult = async (
  query: string,
  onAnswer: (newContent: string) => void,
  onSources: (sources: Source[]) => void
) => {
  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set("q", query);

  return new Promise<void>((resolve) => {
    // first thing would be sources
    let sourcesReceived = false;

    const evtSource = new EventSource(url.toString());
    evtSource.onmessage = async (event) => {
      // when the stream is closed, the backend sends an empty event
      if (!event.data) {
        evtSource.close();
        resolve();
        return;
      }

      try {
        const data = JSON.parse(event.data);
        if (!sourcesReceived) {
          onSources(data);
          sourcesReceived = true;
          return;
        }

        const content: string | undefined = data.choices[0].delta.content;
        if (!content) {
          return;
        }

        onAnswer(content);
      } catch (error) {
        console.error("error while streaming response:", error);
        evtSource.close();
        resolve();
      }
    };

    evtSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      evtSource.close();
      resolve();
    };
  });
};
