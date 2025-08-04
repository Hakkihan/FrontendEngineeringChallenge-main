// components/ActionsPanel.tsx - Document Actions Panel
import { Button } from "./ui/button";

interface ActionsPanelProps {
  onSave: () => void;
  onCreateNewVersion: () => void;
  isSavePending: boolean;
  isCreatePending: boolean;
  isSaveError: boolean;
  isCreateError: boolean;
  saveError: Error | null;
  createError: Error | null;
  canSave: boolean;
  canCreate: boolean;
}

export function ActionsPanel({
  onSave,
  onCreateNewVersion,
  isSavePending,
  isCreatePending,
  isSaveError,
  isCreateError,
  saveError,
  createError,
  canSave,
  canCreate,
}: ActionsPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold mb-2">Actions</h3>
      
      {/* Save Button */}
      <Button
        onClick={onSave}
        disabled={!canSave || isSavePending}
        variant="default"
        className="w-full relative"
      >
        {isSavePending && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-600/50 rounded-md">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          </div>
        )}
        <span className={isSavePending ? "opacity-50" : ""}>
          {isSavePending ? "Saving…" : "Save"}
        </span>
      </Button>
      {isSaveError && (
        <p className="text-red-600">{(saveError as Error).message}</p>
      )}

      {/* Create New Version Button */}
      <Button
        onClick={onCreateNewVersion}
        disabled={!canCreate || isCreatePending}
        variant="default"
        className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 relative"
        title="Create a new document version based on the current content"
      >
        {isCreatePending && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-700/50 rounded-md">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          </div>
        )}
        <span className={isCreatePending ? "opacity-50" : ""}>
          {isCreatePending ? "Creating…" : "Create New Version"}
        </span>
      </Button>
      {isCreateError && (
        <p className="text-red-600">
          {(createError as Error).message}
        </p>
      )}
    </div>
  );
} 