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
import Logo from "./assets/logo.png";
import { NewVersionAlert } from "./components/NewVersionAlert";
import { ActionsPanel } from "./components/ActionsPanel";
import { DocumentVersionsList } from "./components/DocumentVersionsList";
import { PatentSidebar } from "./components/PatentSidebar";
import { getChronologicalNumber } from "./utils";

function App() {
  // ===== STATE HOOKS =====
  const [selectedPatentId, setSelectedPatentId] = useState<number>(1);
  const [draft, setDraft] = useState<ApiDocument | null>(null);
  const [showNewVersionAlert, setShowNewVersionAlert] = useState(false);

  // ===== TANSTACK QUERY HOOKS =====
  const queryClient = useQueryClient();

  // 1) Load list of patents
  const {
    data: patents,
    isLoading: isPatentsLoading,
    isError: isPatentsError,
    error: patentsError,
  } = usePatents();

  // 2) Load the first document for the selected patent
  const {
    data: doc,
    isLoading: isDocLoading,
    isError: isDocError,
    error: docError,
  } = useLatestDocumentByPatent(selectedPatentId);

  // 3) Load all documents for the selected patent
  const {
    data: allDocuments,
    isLoading: isAllDocumentsLoading,
    isError: isAllDocumentsError,
    error: allDocumentsError,
  } = useAllDocumentsByPatent(selectedPatentId);

  // 4) Save mutation
  const save = useSaveDocument();

  // 5) Create new document version mutation
  const createNewVersion = useCreateNewDocumentVersion();

  // ===== EFFECTS =====
  // Auto-select the first patent once they load (if none selected yet)
  useEffect(() => {
    if (!selectedPatentId && patents && patents.length > 0) {
      setSelectedPatentId(patents[0].id);
    }
  }, [patents, selectedPatentId]);

  // Sync draft when a new document arrives
  useEffect(() => {
    if (doc) setDraft(doc);
    else setDraft(null); // no document for this patent
  }, [doc]);

  // ===== FUNCTIONS =====
  // Get the latest document number for the current draft
  const getCurrentDocumentNumber = () => {
    if (!draft || !allDocuments) return 0;
    return getChronologicalNumber(draft.id, allDocuments);
  };

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

  // ===== JSX =====
  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center justify-center top-0 w-full bg-slate-900 text-white text-center z-50 mb-[30px] mt-[8px] h-[80px]">
        <img src={Logo} alt="Logo" style={{ height: "48px" }} />
      </header>

      <div className="flex w-full bg-slate-900 gap-4 justify-center">
        {/* Left: patent list */}
        <PatentSidebar
          patents={patents}
          isLoading={isPatentsLoading}
          isError={isPatentsError}
          error={patentsError}
          selectedPatentId={selectedPatentId}
          onPatentSelect={setSelectedPatentId}
          onPatentHover={prefetchLatestDoc}
        />

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
          <ActionsPanel
            onSave={onSave}
            onCreateNewVersion={onCreateNewVersion}
            isSavePending={save.isPending}
            isCreatePending={createNewVersion.isPending}
            isSaveError={save.isError}
            isCreateError={createNewVersion.isError}
            saveError={save.error}
            createError={createNewVersion.error}
            canSave={!!draft}
            canCreate={!!selectedPatentId}
          />

          <DocumentVersionsList
            documents={allDocuments}
            isLoading={isAllDocumentsLoading}
            isError={isAllDocumentsError}
            error={allDocumentsError}
            selectedDocumentId={draft?.id || null}
            onDocumentSelect={setDraft}
          />
        </aside>
      </div>

      {/* New Version Confirmation Alert */}
      <NewVersionAlert
        isOpen={showNewVersionAlert}
        onClose={() => setShowNewVersionAlert(false)}
        onConfirm={handleConfirmNewVersion}
        isPending={createNewVersion.isPending}
        draft={draft}
      />
    </div>
  );
}

export default App;
