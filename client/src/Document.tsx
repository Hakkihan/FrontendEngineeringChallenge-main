import Editor from "./internal/Editor";
import useWebSocket from "react-use-websocket";
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";

export interface DocumentProps {
  onContentChange: (content: string) => void;
  content: string;
}

const SOCKET_URL = "ws://localhost:8000/ws";

interface SuggestionIssue {
  type: string;
  severity: "high" | "medium" | "low";
  paragraph: number;
  description: string;
  suggestion: string;
}

interface Suggestions {
  issues: SuggestionIssue[];
}

interface SuggestionsResponse {
  suggestions: Suggestions;
  request_id: number;
}

export default function Document({ onContentChange, content }: DocumentProps) {
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [requestId, setRequestId] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const { sendMessage, lastMessage, readyState } = useWebSocket(SOCKET_URL, {
    onOpen: () => {
      console.log("WebSocket Connected");
      setConnectionError(null);
    },
    onClose: () => {
      console.log("WebSocket Disconnected");
      setConnectionError("Connection lost. Trying to reconnect...");
    },
    onError: (error) => {
      console.error("WebSocket Error:", error);
      setConnectionError("Failed to connect to AI service");
    },
    shouldReconnect: (_closeEvent) => true,
  });

  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const response: SuggestionsResponse = JSON.parse(lastMessage.data);
        setSuggestions(response.suggestions);
        setIsAnalyzing(false);
        console.log("Received suggestions:", response.suggestions);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
        setIsAnalyzing(false);
      }
    }
  }, [lastMessage]);

  // Debounce editor content changes
  const sendEditorContent = useCallback(
    debounce((content: string) => {
      if (readyState === 1) { // WebSocket is open
        // Clear suggestions if content is empty
        if (!content.trim()) {
          setSuggestions(null);
          setIsAnalyzing(false);
          return;
        }
        
        const newRequestId = requestId + 1;
        setRequestId(newRequestId);
        setIsAnalyzing(true);
        
        const message = {
          content: content,
          request_id: newRequestId
        };
        
        sendMessage(JSON.stringify(message));
      }
    }, 1000), // Increased debounce time to reduce API calls
    [sendMessage, requestId, readyState]
  );

  const handleEditorChange = (content: string) => {
    onContentChange(content);
    sendEditorContent(content);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <Editor handleEditorChange={handleEditorChange} content={content} />
      </div>
      
      {/* Connection Status */}
      {connectionError && (
        <div className="border-t border-gray-200 bg-red-50 p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm text-red-700">{connectionError}</span>
          </div>
        </div>
      )}
      
      {/* Connected Status */}
      {!connectionError && readyState === 1 && content.trim() && !isAnalyzing && !suggestions && (
        <div className="border-t border-gray-200 bg-green-50 p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-700">AI service ready - start typing to get suggestions</span>
          </div>
        </div>
      )}
      
      {/* Suggestions Panel */}
      {suggestions && suggestions.issues.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">AI Suggestions</h3>
            <button
              onClick={() => setSuggestions(null)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Dismiss
            </button>
          </div>
          <div className="space-y-3">
            {suggestions.issues.map((issue, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  issue.severity === "high"
                    ? "border-red-500 bg-red-50"
                    : issue.severity === "medium"
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-blue-500 bg-blue-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {issue.type}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          issue.severity === "high"
                            ? "bg-red-200 text-red-800"
                            : issue.severity === "medium"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-blue-200 text-blue-800"
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {issue.description}
                    </p>
                    {issue.suggestion && (
                      <div className="bg-white p-2 rounded border">
                        <p className="text-xs text-gray-600 mb-1">Suggestion:</p>
                        <p className="text-sm text-gray-800">{issue.suggestion}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Analyzing indicator */}
      {isAnalyzing && (
        <div className="border-t border-gray-200 bg-blue-50 p-3">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">Analyzing document...</span>
          </div>
        </div>
      )}
    </div>
  );
}
