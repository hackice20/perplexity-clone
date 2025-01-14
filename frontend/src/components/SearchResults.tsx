import { useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { Globe, Sparkles } from "lucide-react";

import { Source } from "@/types";
import Tooltip from "./ui/Tooltip";

interface SearchResultsProps {
  sources: Source[];
  content: string;
  isStreaming: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({ sources, content, isStreaming }) => {
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (responseRef.current && isStreaming) {
      responseRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [content, isStreaming]);

  if (!content && !isStreaming && !sources.length) {
    return null;
  }

  return (
    <div className="p-6 bg-neutral-900 rounded-2xl border border-neutral-800/50 backdrop-blur-sm">
      <h2 className="flex items-center font-semibold text-lg mb-2">
        <Globe className="w-4 mr-2" />
        Sources
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 flex-wrap auto">
        {sources.map((source) => (
          <a
            href={source.link}
            target="_blank"
            rel="noreferrer"
            key={source.link}
            className="flex flex-col justify-between text-sm p-2 rounded bg-neutral-700 bg-opacity-40 hover:bg-opacity-70"
          >
            <p className="font-bold line-clamp-2">{source.title}</p>

            <div className="flex items-center mt-2">
              {source.image && (
                <img
                  src={source.image}
                  className="w-4 h-4 object-cover rounded mr-2"
                  onError={(e) => {
                    e.currentTarget.remove();
                  }}
                />
              )}
              <small className="line-clamp-1">{source.displayLink}</small>
            </div>
          </a>
        ))}
      </div>

      <h2 className="flex items-center font-semibold text-lg mb-1 mt-8">
        <Sparkles className="w-4 mr-2" />
        Answer
      </h2>
      <div ref={responseRef} className="text-neutral-200 leading-relaxed flex-1 max-w-none mt-4" id="search-response">
        <Markdown
          components={{
            p: ({ node, ...props }) => {
              return <div role="paragraph" className="paragraph" {...props} />;
            },

            a: ({ node, children, ...props }) => {
              if (!node) {
                throw new Error("node is undefined");
              }

              // @ts-ignore (probably their types are wrong idk)
              const index = Number(node.children[0].value);
              if (isNaN(index) || index < 0 || index >= sources.length) {
                return (
                  <a {...props} target="_blank" rel="noreferrer">
                    {children}
                  </a>
                );
              }

              const source = sources[index - 1];
              props.href = source.link;

              return (
                <Tooltip
                  content={
                    <div className="w-48">
                      <div className="flex items-center mb-1 text-sm text-gray-400">
                        {source.image && (
                          <img
                            src={source.image}
                            className="w-4 h-4 object-cover rounded mr-2"
                            onError={(e) => {
                              e.currentTarget.remove();
                            }}
                          />
                        )}
                        <small className="line-clamp-1">{source.displayLink}</small>
                      </div>
                      <h3>{source.title}</h3>
                      <p className="line-clamp-3 text-sm text-gray-100 font-light">{source.snippet}</p>
                    </div>
                  }
                >
                  <a {...props} href={source.link} target="_blank" rel="noreferrer" className="citation">
                    {index}
                  </a>
                </Tooltip>
              );
            },
          }}
        >
          {content}
        </Markdown>
        {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-purple-400 animate-pulse" />}
      </div>
    </div>
  );
};

export default SearchResults;