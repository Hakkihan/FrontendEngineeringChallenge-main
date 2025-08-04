// components/NewVersionAlert.tsx - New Version Confirmation Modal
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import type { Document } from "../lib/types";

interface NewVersionAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  draft: Document | null;
}

export function NewVersionAlert({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  draft,
}: NewVersionAlertProps) {
  if (!isOpen) return null;

  return (
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
            onClick={onClose}
            className="min-w-[80px]"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-w-[140px] relative"
          >
            {isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-700/50 rounded-md">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </div>
            )}
            <span className={isPending ? "opacity-50" : ""}>
              {isPending ? "Creating..." : "Create New"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
} 