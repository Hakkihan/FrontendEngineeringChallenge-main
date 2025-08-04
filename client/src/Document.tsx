import Editor from "./internal/Editor";
import useWebSocket from "react-use-websocket";
import { debounce } from "lodash";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const SOCKET_URL = "ws://localhost:8000/ws";

export interface DocumentProps {
  onContentChange: (content: string) => void;
  content: string;
}



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
  const [timeoutError, setTimeoutError] = useState<string | null>(null);

  // Refs to avoid stale closures
  const latestRequestIdRef = useRef(0);
  const analysisTimerRef = useRef<number | null>(null);

  const clearAnalysisTimer = useCallback(() => {
    if (analysisTimerRef.current != null) {
      clearTimeout(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
  }, []);

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
    // Optional: you can set reconnectInterval, reconnectAttempts, etc.
  });

  // Handle incoming messages
  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const response: SuggestionsResponse = JSON.parse(lastMessage.data);

        // Only accept if this response corresponds to the latest pending request
        if (response.request_id === latestRequestIdRef.current) {
          clearAnalysisTimer();
          setIsAnalyzing(false);
          setTimeoutError(null);
          setSuggestions(response.suggestions);
          console.log("Received suggestions:", response.suggestions);
        } else {
          // Late/out-of-order response; ignore
          console.debug(
            "Ignoring stale response for request_id",
            response.request_id,
            "current is",
            latestRequestIdRef.current
          );
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
        clearAnalysisTimer();
        setIsAnalyzing(false);
        setTimeoutError("Error processing AI response. Please try again.");
      }
    }
  }, [lastMessage, clearAnalysisTimer]);

  // Debounced send with timeout protection
  const sendEditorContent = useMemo(
    () =>
      debounce((nextContent: string) => {
        // 1 = WebSocket OPEN in react-use-websocket (ReadyState.OPEN)
        if (readyState !== 1) return;

        // Clear panels if empty content
        if (!nextContent.trim()) {
          setSuggestions(null);
          setIsAnalyzing(false);
          setTimeoutError(null);
          clearAnalysisTimer();
          return;
        }

        // Compute and persist new request id (source of truth is the ref)
        const newRequestId = latestRequestIdRef.current + 1;
        latestRequestIdRef.current = newRequestId;
        setRequestId(newRequestId);
        setIsAnalyzing(true);
        setTimeoutError(null);

        // Send message
        sendMessage(JSON.stringify({ content: nextContent, request_id: newRequestId }));

        // Start a fresh 5s timeout for THIS request
        clearAnalysisTimer();
        analysisTimerRef.current = window.setTimeout(() => {
          // Only fire if we’re still awaiting this exact request
          if (latestRequestIdRef.current === newRequestId) {
            setIsAnalyzing(false);
            setTimeoutError("Analysis timed out after 5 seconds. Please try again.");
          }
        }, 5000);
      }, 1000), // debounce to reduce calls
    [sendMessage, readyState, clearAnalysisTimer]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      sendEditorContent.cancel();
      clearAnalysisTimer();
    };
  }, [sendEditorContent, clearAnalysisTimer]);

  const handleEditorChange = (value: string) => {
    onContentChange(value);
    sendEditorContent(value);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto bg-slate-800">
        <Editor handleEditorChange={handleEditorChange} content={content} />
      </div>

      {/* Connection Status */}
      {connectionError && (
        <div className="border-t border-slate-600 bg-red-900/20 p-3" style={{ fontFamily: "Times New Roman, serif" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span className="text-sm text-red-200">{connectionError}</span>
          </div>
        </div>
      )}

      {/* Connected Status */}
      {!connectionError && readyState === 1 && content.trim() && !isAnalyzing && !suggestions && (
        <div className="border-t border-slate-600 bg-green-900/20 p-3" style={{ fontFamily: "Times New Roman, serif" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-green-200">AI service ready - start typing to get suggestions</span>
          </div>
        </div>
      )}

      {/* Suggestions Panel */}
      {suggestions && suggestions.issues.length > 0 && (
        <div className="border-t border-slate-600 bg-slate-800 p-4 max-h-64 overflow-y-auto" style={{ fontFamily: "Times New Roman, serif" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-100">AI Suggestions</h3>
            <button onClick={() => setSuggestions(null)} className="text-slate-400 hover:text-slate-200 text-sm">
              Dismiss
            </button>
          </div>
          <div className="space-y-3">
            {suggestions.issues.map((issue, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  issue.severity === "high"
                    ? "border-red-400 bg-red-900/20"
                    : issue.severity === "medium"
                    ? "border-yellow-400 bg-yellow-900/20"
                    : "border-blue-400 bg-blue-900/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-100">{issue.type}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          issue.severity === "high"
                            ? "bg-red-800/30 text-red-200"
                            : issue.severity === "medium"
                            ? "bg-yellow-800/30 text-yellow-200"
                            : "bg-blue-800/30 text-blue-200"
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 mb-2">{issue.description}</p>
                    {issue.suggestion && (
                      <div className="bg-slate-700 p-2 rounded border border-slate-600">
                        <p className="text-xs text-slate-300 mb-1">Suggestion:</p>
                        <p className="text-sm text-slate-100">{issue.suggestion}</p>
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
        <div className="border-t border-slate-600 bg-blue-900/20 p-3" style={{ fontFamily: "Times New Roman, serif" }}>
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span className="text-sm text-blue-200">Analyzing document...</span>
          </div>
        </div>
      )}

      {/* Timeout Error */}
      {timeoutError && (
        <div className="border-t border-slate-600 bg-orange-900/20 p-3" style={{ fontFamily: "Times New Roman, serif" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <span className="text-sm text-orange-200">{timeoutError}</span>
            <button
              onClick={() => setTimeoutError(null)}
              className="ml-auto text-orange-300 hover:text-orange-100 text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
