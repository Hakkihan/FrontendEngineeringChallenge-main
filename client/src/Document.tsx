// Document.tsx - Main document editor with AI analysis
import Editor from "./internal/Editor";
import { useAIAnalysis } from "./hooks";
import { AIStatusPanel } from "./components/AIStatusPanel";
import { AISuggestionsPanel } from "./components/AISuggestionsPanel";

export interface DocumentProps {
  onContentChange: (content: string) => void;
  content: string;
}

export default function Document({ onContentChange, content }: DocumentProps) {
  // ===== AI ANALYSIS HOOK =====
  const { state, sendEditorContent, dismissSuggestions, dismissTimeoutError, readyState } = useAIAnalysis();

  // ===== HANDLERS =====
  const handleEditorChange = (value: string) => {
    onContentChange(value);
    sendEditorContent(value);
  };

  // ===== JSX =====
  return (
    <div className="w-full h-full flex flex-col">
      {/* Editor */}
      <div className="flex-1 overflow-y-auto bg-slate-800 custom-scrollbar">
        <Editor handleEditorChange={handleEditorChange} content={content} />
      </div>

      {/* AI Status Panel */}
      <AIStatusPanel
        state={state}
        readyState={readyState}
        content={content}
        onDismissTimeout={dismissTimeoutError}
      />

      {/* AI Suggestions Panel */}
      {state.suggestions && (
        <AISuggestionsPanel
          suggestions={state.suggestions}
          onDismiss={dismissSuggestions}
        />
      )}
    </div>
  );
}
