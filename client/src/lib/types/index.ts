// lib/types/index.ts - Export all TypeScript types and interfaces

// Main application types
export interface PatentEntity {
  id: number;
  name: string;
}

export interface Document {
  id: number;
  patent_entity_id: number;
  content: string;
  created_at: string; // ISO date string from backend
  updated_at: string; // ISO date string from backend
}

// AI-related types
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