// components/DocumentVersionsList.tsx - Document Versions List
import { Card, CardContent, CardHeader } from "./ui/card";
import { extractTitleAndBody, getChronologicalNumber } from "../utils";
import type { Document } from "../lib/types";

interface DocumentVersionsListProps {
  documents: Document[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  selectedDocumentId: number | null;
  onDocumentSelect: (document: Document) => void;
}

export function DocumentVersionsList({
  documents,
  isLoading,
  isError,
  error,
  selectedDocumentId,
  onDocumentSelect,
}: DocumentVersionsListProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold mb-2">Document Versions</h3>

      {isLoading && (
        <p className="text-slate-400">Loading documents...</p>
      )}

      {isError && (
        <p className="text-red-600">
          {(error as Error).message}
        </p>
      )}

      {documents && documents.length > 0 ? (
        <div className="flex flex-col gap-2">
          {documents.map((document) => (
            <Card
              key={document.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                selectedDocumentId === document.id
                  ? "ring-2 ring-slate-400 bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 shadow-lg"
                  : "hover:bg-accent/50 border-border"
              }`}
              onClick={() => onDocumentSelect(document)}
              title={`Document #${getChronologicalNumber(
                document.id,
                documents
              )} - ${extractTitleAndBody(document.content).title}`}
            >
              <CardHeader className="pb-2">
                <div
                  className={`font-semibold text-sm ${
                    selectedDocumentId === document.id
                      ? "text-slate-100"
                      : "text-foreground"
                  }`}
                >
                  Document #
                  {getChronologicalNumber(document.id, documents)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {(() => {
                  const { title, body } = extractTitleAndBody(
                    document.content
                  );
                  return (
                    <div className="space-y-2">
                      {title && (
                        <div
                          className={`text-xs font-medium line-clamp-1 ${
                            selectedDocumentId === document.id
                              ? "text-slate-200"
                              : "text-muted-foreground"
                          }`}
                        >
                          {title}
                        </div>
                      )}
                      <div
                        className={`text-xs line-clamp-2 ${
                          selectedDocumentId === document.id
                            ? "text-slate-200/80"
                            : "text-muted-foreground"
                        }`}
                      >
                        {body}
                      </div>
                      <div className="flex flex-col gap-1 pt-2 border-t border-border/50">
                        <div
                          className={`text-xs ${
                            selectedDocumentId === document.id
                              ? "text-slate-200/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          Created:{" "}
                          {new Date(document.created_at).toLocaleString()}
                        </div>
                        <div
                          className={`text-xs ${
                            selectedDocumentId === document.id
                              ? "text-slate-200/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          Updated:{" "}
                          {new Date(document.updated_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-sm">No documents found</p>
      )}
    </div>
  );
} 