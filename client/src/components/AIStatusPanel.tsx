// components/AIStatusPanel.tsx - AI Status Indicators
import type { AIAnalysisState } from "../lib/types/ai";

interface AIStatusPanelProps {
  state: AIAnalysisState;
  readyState: number;
  content: string;
  onDismissTimeout: () => void;
}

export function AIStatusPanel({
  state,
  readyState,
  content,
  onDismissTimeout,
}: AIStatusPanelProps) {
  const { connectionError, isAnalyzing, timeoutError } = state;

  return (
    <>
      {/* Connection Status */}
      {connectionError && (
        <div
          className="border-t border-slate-600 bg-red-900/20 p-3"
          style={{ fontFamily: "Times New Roman, serif" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span className="text-sm text-red-200">{connectionError}</span>
          </div>
        </div>
      )}

      {/* Connected Status */}
      {!connectionError &&
        readyState === 1 &&
        content.trim() &&
        !isAnalyzing &&
        !state.suggestions && (
          <div
            className="border-t border-slate-600 bg-green-900/20 p-3"
            style={{ fontFamily: "Times New Roman, serif" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-green-200">
                AI service ready - start typing to get suggestions
              </span>
            </div>
          </div>
        )}

      {/* Analyzing indicator */}
      {isAnalyzing && (
        <div
          className="border-t border-slate-600 bg-blue-900/20 p-3"
          style={{ fontFamily: "Times New Roman, serif" }}
        >
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span className="text-sm text-blue-200">Analyzing document...</span>
          </div>
        </div>
      )}

      {/* Timeout Error */}
      {timeoutError && (
        <div
          className="border-t border-slate-600 bg-orange-900/20 p-3"
          style={{ fontFamily: "Times New Roman, serif" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <span className="text-sm text-orange-200">{timeoutError}</span>
            <button
              onClick={onDismissTimeout}
              className="ml-auto text-orange-300 hover:text-orange-100 text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
} 