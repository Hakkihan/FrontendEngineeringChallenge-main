import Document from "./Document";
import { useEffect, useState } from "react";
import axios from "axios";
import LoadingOverlay from "./internal/LoadingOverlay";
import Logo from "./assets/logo.png";

const BACKEND_URL = "http://localhost:8000";

function App() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [patentEntities, setPatentEntities] = useState<PatentEntity>();
  const [currentDocumentInstance, setCurrentDocumentInstance] = useState<Doc>({
    documentId: 0,
    content: "",
    patent_entity_id: undefined,
  });

  useEffect(() => {
    loadPatent(1);
  }, []);

  const loadPatent = async (documentNumber: number) => {
    setIsLoading(true);
    console.log("Loading patent:", documentNumber);
    try {
      const response = await axios.get(`${BACKEND_URL}/document/${documentNumber}`);
      setCurrentDocumentInstance({...currentDocumentInstance,
        documentId: response.data.documentId,
        content: response.data.content,
        patent_entity_id: response.data.patent_entity_id,
      });
    } catch (error) {
      console.error("Error loading document:", error);
    }
    setIsLoading(false);
  };

  const savePatent = async () => {
    setIsLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/save/${currentDocumentInstance.documentId}`, {
        currentDocumentInstance 
        // documentId: currentDocumentInstance.documentId ,
        // content: currentDocumentInstance.content,
        // patent_entity_id: currentDocumentInstance.patent_entity_id,
      });
    } catch (error) {
      console.error("Error saving document:", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {isLoading && <LoadingOverlay />}
      <header className="flex items-center justify-center top-0 w-full bg-black text-white text-center z-50 mb-[30px] h-[80px]">
        <img src={Logo} alt="Logo" style={{ height: "50px" }} />
      </header>
      <div className="flex w-full bg-white h=[calc(100%-100px) gap-4 justify-center box-shadow">
        <div className="flex flex-col h-full items-center gap-2 px-4">
          <button onClick={() => loadPatent(1)}>Patent 1</button>
          <button onClick={() => loadPatent(2)}>Patent 2</button>
        </div>
        <div className="flex flex-col h-full items-center gap-2 px-4 flex-1">
          <h2 className="self-start text-[#213547] opacity-60 text-2xl font-semibold">
            {`Patent ${currentDocumentInstance.documentId}`}
          </h2>
          <Document
            onContentChange={(newContent) =>
              setCurrentDocumentInstance((prev) => ({
                ...prev,
                content: newContent,
              }))
            }
            content={currentDocumentInstance.content}
          />
        </div>
        <div className="flex flex-col h-full items-center gap-2 px-4">
          <button onClick={savePatent}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default App;
