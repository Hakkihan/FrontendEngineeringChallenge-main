// api.ts
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "axios";

const BACKEND_URL = "http://localhost:8000";

// Types
export interface PatentEntity {
  id: number;      // <-- change to id
  name: string;
}

export interface Document {
  id: number;      // <-- change to id (backend uses id)
  patent_entity_id: number;
  content: string;
  created_at: string; // ISO date string from backend
}

// API functions

const fetchPatents = async (): Promise<PatentEntity[]> => {
  const { data } = await axios.get(`${BACKEND_URL}/patent_entity/list`);
  return data;
};

// api.ts
export const fetchLatestDocumentByPatent = async (patentId: number) => {
  if (!patentId) {
    throw new Error('patentId is required');
  }
  const { data } = await axios.get<Document | null>(`${BACKEND_URL}/patent_entity/${patentId}/documents/latest`);
  return data;
};

const fetchAllDocumentsByPatent = async (patentId: number): Promise<Document[]> => {
  if (!patentId) {
    throw new Error('patentId is required');
  }
  const { data } = await axios.get<Document[]>(`${BACKEND_URL}/patent_entity/${patentId}/documents`);
  return data;
};

const fetchDocument = async (documentNumber: number): Promise<Document> => {
  const { data } = await axios.get<Document>(`${BACKEND_URL}/document/${documentNumber}`);
  return data;
};

const saveDocument = async (payload: Document): Promise<Document> => {
  const { data } = await axios.post<Document>(`${BACKEND_URL}/document/${payload.id}/save`, payload);
  return data; 
};

const createNewDocumentVersion = async (patentId: number, content: string): Promise<Document> => {
  if (!patentId) {
    throw new Error('patentId is required');
  }
  const { data } = await axios.post<Document>(`${BACKEND_URL}/document/patent/${patentId}/new-version`, {
    content,
    patent_entity_id: patentId
  });
  return data;
};

// Hooks
export const usePatents = () =>
  useQuery({
    queryKey: ["patents"],          // plural key for the list
    queryFn: fetchPatents,
  });

export const useLatestDocumentByPatent = (patentId: number) =>
  useQuery({
    queryKey: ["latestDocumentByPatent", patentId],
    queryFn: () => fetchLatestDocumentByPatent(patentId),
    enabled: !!patentId,
  });

export const useAllDocumentsByPatent = (patentId: number) =>
  useQuery({
    queryKey: ["allDocumentsByPatent", patentId],
    queryFn: () => fetchAllDocumentsByPatent(patentId),
    enabled: !!patentId,
  });

export const useDocument = (documentNumber?: number) =>
  useQuery({
    queryKey: ["document", documentNumber],
    queryFn: () => fetchDocument(documentNumber!),
    enabled: !!documentNumber,      // only fetch when we have an id
  });

export const useSaveDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveDocument,
    onSuccess: (updated) => {
      // 1) Put updated doc straight into the cache bucket you read from
      qc.setQueryData(["latestDocumentByPatent", updated.patent_entity_id], updated);

      // 2) And also revalidate the same query key (ensures canonical server copy)
      qc.invalidateQueries({
        queryKey: ["latestDocumentByPatent", updated.patent_entity_id],
        refetchType: "active",
      });

      // 3) Also invalidate the all documents query to refresh the document list
      qc.invalidateQueries({
        queryKey: ["allDocumentsByPatent", updated.patent_entity_id],
        refetchType: "active",
      });
    },
  });
};

export const useCreateNewDocumentVersion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ patentId, content }: { patentId: number; content: string }) =>
      createNewDocumentVersion(patentId, content),
    onSuccess: (newDocument) => {
      // Update the latest document cache
      qc.setQueryData(["latestDocumentByPatent", newDocument.patent_entity_id], newDocument);
      
      // Invalidate queries to refresh the data
      qc.invalidateQueries({
        queryKey: ["latestDocumentByPatent", newDocument.patent_entity_id],
        refetchType: "active",
      });
      
      qc.invalidateQueries({
        queryKey: ["allDocumentsByPatent", newDocument.patent_entity_id],
        refetchType: "active",
      });
    },
  });
};
