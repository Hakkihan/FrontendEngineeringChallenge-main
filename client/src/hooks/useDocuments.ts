// hooks/useDocuments.ts - Document-related React Query hooks
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  fetchLatestDocumentByPatent,
  fetchAllDocumentsByPatent,
  fetchDocument,
  saveDocument,
  createNewDocumentVersion,
} from "../lib/api";

// Query hooks
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
    enabled: !!documentNumber,
  });

// Mutation hooks
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