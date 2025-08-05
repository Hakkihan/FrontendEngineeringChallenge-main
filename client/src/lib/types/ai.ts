// lib/types/ai.ts - AI-related TypeScript interfaces

export interface SuggestionIssue {
  type: string;
  severity: "high" | "medium" | "low";
  paragraph: number;
  description: string;
  suggestion: string;
}

export interface Suggestions {
  issues: SuggestionIssue[];
}

export interface SuggestionsResponse {
  suggestions: Suggestions;
  request_id: number;
}

export interface AIAnalysisState {
  suggestions: Suggestions | null;
  isAnalyzing: boolean;
  requestId: number;
  connectionError: string | null;
  timeoutError: string | null;
} 