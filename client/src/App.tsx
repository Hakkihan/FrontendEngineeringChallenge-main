// App.tsx
import { useEffect, useState } from "react";
import {
  usePatents,
  useLatestDocumentByPatent,
  useAllDocumentsByPatent,
  useSaveDocument,
  useCreateNewDocumentVersion,
  fetchLatestDocumentByPatent,
  type Document as ApiDocument,
} from "./lib/api";
import { useQueryClient } from "@tanstack/react-query";
import DocumentEditor from "./Document";
import LoadingOverlay from "./internal/LoadingOverlay";
import Logo from "./assets/logo.png";

// Helper function to extract title and body content from HTML
const extractTitleAndBody = (html: string): { title: string; body: string } => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Extract title (look for <title> tag or first <h1> or <h2>)
  let title = '';
  const titleTag = tempDiv.querySelector('title');
  const h1Tag = tempDiv.querySelector('h1');
  const h2Tag = tempDiv.querySelector('h2');
  
  if (titleTag) {
    title = titleTag.textContent || '';
  } else if (h1Tag) {
    title = h1Tag.textContent || '';
  } else if (h2Tag) {
    title = h2Tag.textContent || '';
  }
  
  // Extract body content (everything except title/headings)
  let body = '';
  const bodyTag = tempDiv.querySelector('body');
  if (bodyTag) {
    body = bodyTag.textContent || '';
  } else {
    // If no body tag, get all text content except title
    const allText = tempDiv.textContent || '';
    body = allText.replace(title, '').trim();
  }
  
  return { title, body };
};

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

  // 5) Local draft for editing
  const [draft, setDraft] = useState<ApiDocument | null>(null);

  // Sync draft when a new document arrives
  useEffect(() => {
    if (doc) setDraft(doc);
    else setDraft(null); // no document for this patent
  }, [doc]);

  // 6) Save mutation
  const save = useSaveDocument();

  // 7) Create new document version mutation
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
    
    // If no draft exists, create a new document with empty content
    const contentToUse = draft?.content || "";
    
    // Confirm with user before creating new version
    const confirmed = window.confirm(
      draft 
        ? "This will create a new document version based on the current content. Continue?"
        : "This will create a new empty document version. Continue?"
    );
    
    if (!confirmed) return;
    
    // Create a new version based on the current draft content
    createNewVersion.mutate(
      { 
        patentId: selectedPatentId, 
        content: contentToUse
      },
      {
        onSuccess: (newDocument) => {
          // Set the new document as the current draft
          setDraft(newDocument);
          // Show success message
          alert(`New document version #${newDocument.id} created successfully!`);
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

  const showLoader = isPatentsLoading || isDocLoading || save.isPending || createNewVersion.isPending;

  return (
    <div className="flex flex-col h-full w-full">
      {showLoader && <LoadingOverlay />}

      <header className="flex items-center justify-center top-0 w-full bg-black text-white text-center z-50 mb-[30px] h-[80px]">
        <img src={Logo} alt="Logo" style={{ height: "50px" }} />
      </header>

             <div className="flex w-full bg-white gap-4 justify-center">
         {/* Left: patent list */}
         <aside className="flex flex-col gap-2 px-4 w-64 flex-shrink-0">
          <h3 className="font-semibold mb-2">Patents</h3>

          {isPatentsError && (
            <p className="text-red-600">{(patentsError as Error).message}</p>
          )}

          {patents?.map((p) => {
            return (
              <button
                key={p.id}
                className={`px-3 py-2 rounded border text-left ${
                  selectedPatentId === p.id ? "bg-gray-200" : ""
                }`}
                onMouseEnter={() => {
                  if (p && p.id && !isPatentsLoading) {
                    prefetchLatestDoc(p.id);
                  }
                }}
                onClick={() => setSelectedPatentId(p.id)}
                title={p.name}
              >
                {p.name}
              </button>
            );
          })}
        </aside>

                 {/* Center: document editor */}
         <main className="flex-1 flex flex-col gap-3 px-4 min-w-0">
          <h2 className="self-start text-[#213547] opacity-60 text-2xl font-semibold">
            {draft
              ? `Patent Document #${draft.id}`
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
            <button
              onClick={onSave}
              disabled={!draft || save.isPending}
              className="px-3 py-2 rounded border"
            >
              {save.isPending ? "Saving…" : "Save"}
            </button>
            {save.isError && (
              <p className="text-red-600">{(save.error as Error).message}</p>
            )}
            
            {/* Create New Version button */}
            <button
              onClick={onCreateNewVersion}
              disabled={!selectedPatentId || createNewVersion.isPending}
              className="px-3 py-2 rounded border bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
              title="Create a new document version based on the current content"
            >
              {createNewVersion.isPending ? "Creating…" : "Create New Version"}
            </button>
            {createNewVersion.isError && (
              <p className="text-red-600">{(createNewVersion.error as Error).message}</p>
            )}
          </div>

          {/* Document versions list */}
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold mb-2">Document Versions</h3>
            
            {isAllDocumentsLoading && (
              <p className="text-gray-500">Loading documents...</p>
            )}

            {isAllDocumentsError && (
              <p className="text-red-600">{(allDocumentsError as Error).message}</p>
            )}

            {allDocuments && allDocuments.length > 0 ? (
              <div className="flex flex-col gap-1">
                {allDocuments.map((document) => (
                  <button
                    key={document.id}
                                                              className={`px-3 py-2 rounded border text-left text-sm transition-colors ${
                        draft?.id === document.id 
                          ? "bg-green-500 text-white border-green-600 shadow-md" 
                          : "hover:bg-gray-50 border-gray-200 bg-white"
                      }`}
                    onClick={() => {
                      // Load this specific document version
                      setDraft(document);
                    }}
                                         title={`Document #${document.id} - ${extractTitleAndBody(document.content).title}`}
                   >
                                           <div className={`font-medium ${draft?.id === document.id ? "text-white" : "text-gray-900"}`}>
                        Document #{document.id}
                      </div>
                      {(() => {
                        const { title, body } = extractTitleAndBody(document.content);
                        return (
                          <>
                                                         {title && (
                               <div className={`text-xs font-semibold truncate ${
                                 draft?.id === document.id ? "text-green-100" : "text-gray-700"
                               }`}>
                                 {title}
                               </div>
                             )}
                             <div className={`text-xs line-clamp-2 overflow-hidden ${
                               draft?.id === document.id ? "text-green-100" : "text-gray-500"
                             }`}>
                               {body}
                             </div>
                           </>
                         );
                       })()}
                       <div className={`text-xs mt-1 ${
                         draft?.id === document.id ? "text-green-200" : "text-gray-400"
                       }`}>
                         Created: {new Date(document.created_at).toLocaleString()}
                       </div>
                       <div className={`text-xs ${
                         draft?.id === document.id ? "text-green-200" : "text-gray-400"
                       }`}>
                         Updated: {new Date(document.updated_at).toLocaleString()}
                       </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No documents found</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
