// hooks/useAIAnalysis.ts - Custom hook for AI analysis logic
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useWebSocket from "react-use-websocket";
import { debounce } from "lodash";
import type { Suggestions, SuggestionsResponse, AIAnalysisState } from "../lib/types/ai";

const SOCKET_URL = "ws://localhost:8000/ws";

export function useAIAnalysis() {
  // State
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

  // WebSocket connection
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
        sendMessage(
          JSON.stringify({ content: nextContent, request_id: newRequestId })
        );

        // Start a fresh 5s timeout for THIS request
        clearAnalysisTimer();
        analysisTimerRef.current = window.setTimeout(() => {
          // Only fire if we're still awaiting this exact request
          if (latestRequestIdRef.current === newRequestId) {
            setIsAnalyzing(false);
            setTimeoutError(
              "Analysis timed out after 10 seconds. Please try again."
            );
          }
        }, 10000);
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

  // Actions
  const dismissSuggestions = useCallback(() => {
    setSuggestions(null);
  }, []);

  const dismissTimeoutError = useCallback(() => {
    setTimeoutError(null);
  }, []);

  // State object for easy passing to components
  const state: AIAnalysisState = {
    suggestions,
    isAnalyzing,
    requestId,
    connectionError,
    timeoutError,
  };

  return {
    state,
    sendEditorContent,
    dismissSuggestions,
    dismissTimeoutError,
    readyState,
  };
} 