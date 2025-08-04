// api.ts - Pure API functions
import axios from "axios";
import type { PatentEntity, Document } from "./types";

const BACKEND_URL = "http://localhost:8000";

// API functions
export const fetchPatents = async (): Promise<PatentEntity[]> => {
  const { data } = await axios.get(`${BACKEND_URL}/patent_entity/list`);
  return data;
};

export const fetchLatestDocumentByPatent = async (patentId: number): Promise<Document | null> => {
  if (!patentId) {
    throw new Error('patentId is required');
  }
  const { data } = await axios.get<Document | null>(`${BACKEND_URL}/patent_entity/${patentId}/documents/latest`);
  return data;
};

export const fetchAllDocumentsByPatent = async (patentId: number): Promise<Document[]> => {
  if (!patentId) {
    throw new Error('patentId is required');
  }
  const { data } = await axios.get<Document[]>(`${BACKEND_URL}/patent_entity/${patentId}/documents`);
  return data;
};

export const fetchDocument = async (documentNumber: number): Promise<Document> => {
  const { data } = await axios.get<Document>(`${BACKEND_URL}/document/${documentNumber}`);
  return data;
};

export const saveDocument = async (payload: Document): Promise<Document> => {
  const { data } = await axios.post<Document>(`${BACKEND_URL}/document/${payload.id}/save`, payload);
  return data; 
};

export const createNewDocumentVersion = async (patentId: number, content: string): Promise<Document> => {
  if (!patentId) {
    throw new Error('patentId is required');
  }
  const { data } = await axios.post<Document>(`${BACKEND_URL}/document/patent/${patentId}/new-version`, {
    content,
    patent_entity_id: patentId
  });
  return data;
};
