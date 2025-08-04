// components/PatentSidebar.tsx - Patent Selection Sidebar
import { Button } from "./ui/button";
import { Sidebar } from "./ui/sidebar";
import type { PatentEntity } from "../lib/types";

interface PatentSidebarProps {
  patents: PatentEntity[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  selectedPatentId: number;
  onPatentSelect: (patentId: number) => void;
  onPatentHover: (patentId: number) => void;
}

export function PatentSidebar({
  patents,
  isLoading,
  isError,
  error,
  selectedPatentId,
  onPatentSelect,
  onPatentHover,
}: PatentSidebarProps) {
  return (
    <Sidebar title="Patents" className="px-4 flex-shrink-0">
      {isError && (
        <p className="text-red-600">{(error as Error).message}</p>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
        </div>
      )}

      {patents?.map((patent) => (
        <Button
          key={patent.id}
          variant={selectedPatentId === patent.id ? "default" : "outline"}
          className="justify-start w-full text-left h-12 p-2 overflow-hidden"
          onMouseEnter={() => {
            if (patent && patent.id && !isLoading) {
              onPatentHover(patent.id);
            }
          }}
          onClick={() => onPatentSelect(patent.id)}
          title={patent.name}
        >
          <div className="w-full line-clamp-2 text-left">{patent.name}</div>
        </Button>
      ))}
    </Sidebar>
  );
} 