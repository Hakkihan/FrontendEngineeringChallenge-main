import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const BACKEND_URL = "http://localhost:8000";

// Types
export interface Document {
  documentId: number;
  content: string;
  patent_entity_id?: number;
}

// API functions
const fetchDocument = async (documentNumber: number): Promise<Document> => {
  const response = await axios.get(`${BACKEND_URL}/document/${documentNumber}`);
  return response.data;
};

const saveDocument = async ({ documentId, content, patent_entity_id }: Document): Promise<void> => {
  await axios.post(`${BACKEND_URL}/save/${documentId}`, {
    documentId,
    content,
    patent_entity_id,
  });
};

// Custom hooks
export const useDocument = (documentNumber: number) => {
  return useQuery({
    queryKey: ['document', documentNumber],
    queryFn: () => fetchDocument(documentNumber),
    enabled: !!documentNumber,
  });
};

export const useSaveDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: saveDocument,
    onSuccess: (_, variables) => {
      // Invalidate and refetch the document query
      queryClient.invalidateQueries({ queryKey: ['document', variables.documentId] });
    },
    onError: (error) => {
      console.error('Error saving document:', error);
    },
  });
}; 