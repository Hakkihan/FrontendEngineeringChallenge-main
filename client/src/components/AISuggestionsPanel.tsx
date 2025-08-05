// components/AISuggestionsPanel.tsx - AI Suggestions Display
import type { Suggestions } from "../lib/types";

interface AISuggestionsPanelProps {
  suggestions: Suggestions;
  onDismiss: () => void;
}

export function AISuggestionsPanel({
  suggestions,
  onDismiss,
}: AISuggestionsPanelProps) {
  if (!suggestions || suggestions.issues.length === 0) {
    return null;
  }

  return (
    <div
      className="border-t border-slate-600 bg-slate-800 p-4 max-h-64 overflow-y-auto custom-scrollbar"
      style={{ fontFamily: "Times New Roman, serif" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-100">AI Suggestions</h3>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-200 text-sm"
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
                ? "border-red-400 bg-red-900/20"
                : issue.severity === "medium"
                ? "border-yellow-400 bg-yellow-900/20"
                : "border-blue-400 bg-blue-900/20"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-100">
                    {issue.type}
                  </span>
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
                <p className="text-sm text-slate-200 mb-2">
                  {issue.description}
                </p>
                {issue.suggestion && (
                  <div className="bg-slate-700 p-2 rounded border border-slate-600">
                    <p className="text-xs text-slate-300 mb-1">
                      Suggestion:
                    </p>
                    <p className="text-sm text-slate-100">
                      {issue.suggestion}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 