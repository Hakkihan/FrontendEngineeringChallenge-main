// App.tsx
import { useEffect, useState } from "react";
import {
  usePatents,
  useLatestDocumentByPatent,
  useSaveDocument,
  fetchLatestDocumentByPatent,
  type Document as ApiDocument,
} from "./lib/api";
import { useQueryClient } from "@tanstack/react-query";
import DocumentEditor from "./Document";
import LoadingOverlay from "./internal/LoadingOverlay";
import Logo from "./assets/logo.png";

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

  // 4) Local draft for editing
  const [draft, setDraft] = useState<ApiDocument | null>(null);

  // Sync draft when a new document arrives
  useEffect(() => {
    if (doc) setDraft(doc);
    else setDraft(null); // no document for this patent
  }, [doc]);

  // 5) Save mutation
  const save = useSaveDocument();

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

  // Optional: prefetch the first document on hover for snappier UX
  const prefetchLatestDoc = (patentId: number | undefined) => {
    if (!patentId) return; // Don't prefetch if patentId is undefined
    queryClient.prefetchQuery({
      queryKey: ["latestDocumentByPatent", patentId],
      queryFn: () => fetchLatestDocumentByPatent(patentId),
    });
  };

  const showLoader = isPatentsLoading || isDocLoading || save.isPending;

  return (
    <div className="flex flex-col h-full w-full">
      {showLoader && <LoadingOverlay />}

      <header className="flex items-center justify-center top-0 w-full bg-black text-white text-center z-50 mb-[30px] h-[80px]">
        <img src={Logo} alt="Logo" style={{ height: "50px" }} />
      </header>

      <div className="flex w-full bg-white gap-4 justify-center">
        {/* Left: patent list */}
        <aside className="flex flex-col gap-2 px-4 min-w-[240px]">
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
        <main className="flex-1 flex flex-col gap-3 px-4">
          <h2 className="self-start text-[#213547] opacity-60 text-2xl font-semibold">
            {doc
              ? `Patent Document #${doc.id}`
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

        {/* Right: actions */}
        <aside className="flex flex-col gap-2 px-4 min-w-[180px]">
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
        </aside>
      </div>
    </div>
  );
}

export default App;
