// App.tsx
import { useEffect, useState } from "react";
import {
  usePatents,
  useLatestDocumentByPatent,
  useAllDocumentsByPatent,
  useSaveDocument,
  useCreateNewDocumentVersion,
} from "./hooks";
import {
  fetchLatestDocumentByPatent,
  type Document as ApiDocument,
} from "./lib";
import { useQueryClient } from "@tanstack/react-query";
import DocumentEditor from "./Document";
import LoadingOverlay from "./internal/LoadingOverlay";
import Logo from "./assets/logo.png";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader } from "./components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { Sidebar } from "./components/ui/sidebar";
import { extractTitleAndBody, getChronologicalNumber } from "./utils";

function App() {
  const queryClient = useQueryClient();

  // 1) Load list of patents
  const {
    data: patents,
    isLoading: isPatentsLoading,
    isError: isPatentsError,
    error: patentsError,
  } = usePatents();

  // 2) Which patent is selected?
  const [selectedPatentId, setSelectedPatentId] = useState<number>(1);

  // Auto-select the first patent once they load (if none selected yet)
  useEffect(() => {
    if (!selectedPatentId && patents && patents.length > 0) {
      setSelectedPatentId(patents[0].id);
    }
  }, [patents, selectedPatentId]);

  // 3) Load the first document for the selected patent
  const {
    data: doc,
    isLoading: isDocLoading,
    isError: isDocError,
    error: docError,
  } = useLatestDocumentByPatent(selectedPatentId);

  // 4) Load all documents for the selected patent
  const {
    data: allDocuments,
    isLoading: isAllDocumentsLoading,
    isError: isAllDocumentsError,
    error: allDocumentsError,
  } = useAllDocumentsByPatent(selectedPatentId);



  // Get the latest document number for the current draft
  const getCurrentDocumentNumber = () => {
    if (!draft || !allDocuments) return 0;
    return getChronologicalNumber(draft.id, allDocuments);
  };

  // 5) Local draft for editing
  const [draft, setDraft] = useState<ApiDocument | null>(null);

  // 6) Alert state for new version confirmation
  const [showNewVersionAlert, setShowNewVersionAlert] = useState(false);

  // Sync draft when a new document arrives
  useEffect(() => {
    if (doc) setDraft(doc);
    else setDraft(null); // no document for this patent
  }, [doc]);

  // 7) Save mutation
  const save = useSaveDocument();

  // 8) Create new document version mutation
  const createNewVersion = useCreateNewDocumentVersion();

  const onSave = () => {
    if (!draft) return;
    save.mutate(draft, {
      onSuccess: async () => {
        const updated = await fetchLatestDocumentByPatent(
          draft.patent_entity_id
        );
        setDraft(updated); // ✅ update the local state manually
      },
    });
  };

  const onCreateNewVersion = () => {
    if (!selectedPatentId) return;
    setShowNewVersionAlert(true);
  };

  const handleConfirmNewVersion = () => {
    if (!selectedPatentId) return;

    // If no draft exists, create a new document with empty content
    const contentToUse = draft?.content || "";

    // Create a new version based on the current draft content
    createNewVersion.mutate(
      {
        patentId: selectedPatentId,
        content: contentToUse,
      },
      {
        onSuccess: (newDocument) => {
          // Set the new document as the current draft
          setDraft(newDocument);
          // Close the alert
          setShowNewVersionAlert(false);
        },
      }
    );
  };

  // Optional: prefetch the first document on hover for snappier UX
  const prefetchLatestDoc = (patentId: number | undefined) => {
    if (!patentId) return; // Don't prefetch if patentId is undefined
    queryClient.prefetchQuery({
      queryKey: ["latestDocumentByPatent", patentId],
      queryFn: () => fetchLatestDocumentByPatent(patentId),
    });
  };

  return (
    <div className="flex flex-col h-full w-full">

      <header className="flex items-center justify-center top-0 w-full bg-slate-900 text-white text-center z-50 mb-[30px] mt-[8px] h-[80px]">
        <img src={Logo} alt="Logo" style={{ height: "48px" }} />
      </header>

             <div className="flex w-full bg-slate-900 gap-4 justify-center">
        {/* Left: patent list */}
                 <Sidebar title="Patents" className="px-4 flex-shrink-0">
           {isPatentsError && (
             <p className="text-red-600">{(patentsError as Error).message}</p>
           )}

           {isPatentsLoading && (
             <div className="flex items-center justify-center py-4">
               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
             </div>
           )}

           {patents?.map((p) => {
            return (
              <Button
                key={p.id}
                variant={selectedPatentId === p.id ? "default" : "outline"}
                className="justify-start w-full text-left h-12 p-2 overflow-hidden"
                onMouseEnter={() => {
                  if (p && p.id && !isPatentsLoading) {
                    prefetchLatestDoc(p.id);
                  }
                }}
                onClick={() => setSelectedPatentId(p.id)}
                title={p.name}
              >
                <div className="w-full line-clamp-2 text-left">{p.name}</div>
              </Button>
            );
          })}
        </Sidebar>

        {/* Center: document editor */}
        <main className="flex-1 flex flex-col gap-3 px-4 min-w-0">
                                <h2 className="self-start text-slate-50 opacity-90 text-2xl font-semibold">
             {draft
               ? `Patent Document #${getCurrentDocumentNumber()}`
               : selectedPatentId
               ? "No document for this patent yet"
               : "Select a patent"}
           </h2>

          {isDocError && (
            <p className="text-red-600">{(docError as Error).message}</p>
          )}

          {draft && (
            <DocumentEditor
              content={draft.content}
              onContentChange={(newContent) =>
                setDraft((prev) =>
                  prev ? { ...prev, content: newContent } : prev
                )
              }
            />
          )}
        </main>

        {/* Right: actions and document list */}
        <aside className="flex flex-col gap-4 px-4 w-64 flex-shrink-0">
          {/* Save button */}
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold mb-2">Actions</h3>
                         <Button
               onClick={onSave}
               disabled={!draft || save.isPending}
               variant="default"
               className="w-full relative"
             >
               {save.isPending && (
                 <div className="absolute inset-0 flex items-center justify-center bg-slate-600/50 rounded-md">
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                 </div>
               )}
               <span className={save.isPending ? "opacity-50" : ""}>
                 {save.isPending ? "Saving…" : "Save"}
               </span>
             </Button>
            {save.isError && (
              <p className="text-red-600">{(save.error as Error).message}</p>
            )}

            {/* Create New Version button */}
                         <Button
               onClick={onCreateNewVersion}
               disabled={!selectedPatentId || createNewVersion.isPending}
               variant="default"
               className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 relative"
               title="Create a new document version based on the current content"
             >
               {createNewVersion.isPending && (
                 <div className="absolute inset-0 flex items-center justify-center bg-slate-700/50 rounded-md">
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                 </div>
               )}
               <span className={createNewVersion.isPending ? "opacity-50" : ""}>
                 {createNewVersion.isPending ? "Creating…" : "Create New Version"}
               </span>
             </Button>
            {createNewVersion.isError && (
              <p className="text-red-600">
                {(createNewVersion.error as Error).message}
              </p>
            )}
          </div>

          {/* Document versions list */}
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold mb-2">Document Versions</h3>

            {isAllDocumentsLoading && (
              <p className="text-slate-400">Loading documents...</p>
            )}

            {isAllDocumentsError && (
              <p className="text-red-600">
                {(allDocumentsError as Error).message}
              </p>
            )}

            {allDocuments && allDocuments.length > 0 ? (
              <div className="flex flex-col gap-2">
                {allDocuments.map((document) => (
                  <Card
                    key={document.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                                             draft?.id === document.id 
                         ? "ring-2 ring-slate-400 bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 shadow-lg" 
                         : "hover:bg-accent/50 border-border"
                    }`}
                    onClick={() => {
                      // Load this specific document version
                      setDraft(document);
                    }}
                                                              title={`Document #${getChronologicalNumber(document.id, allDocuments)} - ${
                        extractTitleAndBody(document.content).title
                      }`}
                  >
                                         <CardHeader className="pb-2">
                       <div
                         className={`font-semibold text-sm ${
                           draft?.id === document.id
                             ? "text-slate-100"
                             : "text-foreground"
                         }`}
                       >
                                                   Document #{getChronologicalNumber(document.id, allDocuments)}
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
                                                                   draft?.id === document.id
                                   ? "text-slate-200"
                                   : "text-muted-foreground"
                                }`}
                              >
                                {title}
                              </div>
                            )}
                            <div
                              className={`text-xs line-clamp-2 ${
                                                               draft?.id === document.id
                                 ? "text-slate-200/80"
                                 : "text-muted-foreground"
                              }`}
                            >
                              {body}
                            </div>
                            <div className="flex flex-col gap-1 pt-2 border-t border-border/50">
                              <div
                                className={`text-xs ${
                                  draft?.id === document.id
                                    ? "text-slate-200/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                Created:{" "}
                                {new Date(document.created_at).toLocaleString()}
                              </div>
                              <div
                                className={`text-xs ${
                                  draft?.id === document.id
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
        </aside>
      </div>

      {/* New Version Confirmation Alert */}
      {showNewVersionAlert && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-4">
            <Alert>
              <AlertTitle>Create New Document Version</AlertTitle>
              <AlertDescription>
                {draft
                  ? "This will create a new document version based on the current content. Continue?"
                  : "This will create a new empty document version. Continue?"}
              </AlertDescription>
            </Alert>
            <div className="flex gap-3 mt-6 justify-center items-center">
              <Button
                variant="outline"
                onClick={() => setShowNewVersionAlert(false)}
                className="min-w-[80px]"
              >
                Cancel
              </Button>
                             <Button
                 onClick={handleConfirmNewVersion}
                 disabled={createNewVersion.isPending}
                 className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-w-[140px] relative"
               >
                 {createNewVersion.isPending && (
                   <div className="absolute inset-0 flex items-center justify-center bg-slate-700/50 rounded-md">
                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                   </div>
                 )}
                 <span className={createNewVersion.isPending ? "opacity-50" : ""}>
                   {createNewVersion.isPending ? "Creating..." : "Create New"}
                 </span>
               </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
