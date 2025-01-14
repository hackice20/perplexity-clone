import { Brain } from "lucide-react";
import { useState } from "react";

import SearchInput from "./components/SearchInput";
import SearchResults from "./components/SearchResults";
import { Source } from "./types";

// we only have one endpoint for now so let's keep it simple
const SEARCH_ENDPOINT = "http://localhost:8080/search";

function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSearch = async (query: string) => {
    setSources([]);
    setContent("");
    setIsStreaming(true);

    await streamResult(
      query,
      (newContent) => {
        setContent((prev) => prev + newContent);
      },
      setSources
    );

    setIsStreaming(false);
  };

  return (
    <div className="min-h-screen  text-white">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-12">
          <Brain className="w-8 h-8 text-purple-400" />
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
            AI Search Assistant
          </h1>
        </div>

        <div className="space-y-6">
          <SearchInput onSearch={handleSearch} isLoading={isStreaming} />
          <SearchResults sources={sources} content={content} isStreaming={isStreaming} />
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

  // first thing would be sources
  let sourcesReceived = false;

  const buffer: string[] = [];

  const evtSource = new EventSource(url.toString());
  evtSource.onmessage = async (event) => {
    try {
      if (event.data === "[DONE]") {
        const rest = buffer.join("");
        if (rest) {
          onAnswer(rest);
        }

        evtSource.close();
        return;
      }

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

      const joined = buffer.join("") + content;
      if (joined.split(/\s+/).length > 4) {
        onAnswer(joined);
        buffer.length = 0;
      } else {
        buffer.push(content);
      }
    } catch (error) {
      console.error("error while streaming response:", error);
      evtSource.close();
    }
  };
};