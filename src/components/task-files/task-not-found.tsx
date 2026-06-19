import { FolderOpen } from "lucide-react";

export function TaskNotFound({
  taskId,
  onBack,
}: {
  taskId: string;
  onBack: () => void;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center">
      <FolderOpen className="mx-auto mb-3 h-12 w-12 text-amber-400" />
      <p className="font-extrabold text-amber-700">Task Not Found</p>
      <p className="mt-1 text-sm text-amber-600">
        Task #{taskId} does not exist or you don&apos;t have access to it.
      </p>
      <p className="mt-2 text-xs text-amber-500">
        Make sure you&apos;ve accepted a bid on this task first.
      </p>
      <button
        type="button"
        className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white"
        onClick={onBack}
      >
        Go Back to Dashboard
      </button>
    </div>
  );
}
