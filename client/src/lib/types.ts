// lib/types.ts - All TypeScript types and interfaces

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