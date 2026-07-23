import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import type { Role } from "@/lib/types";

export function FileExchangeHeader({
  taskId,
  taskTitle,
  role,
  onBack,
  onRefresh,
}: {
  taskId: string;
  taskTitle?: string;
  role: Role;
  onBack: () => void;
  onRefresh: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-20 bg-gradient-to-br from-[#5b35c8] via-[#4c24b7] to-[#371184] px-4 pb-4 pt-safe-4 text-white shadow-[0_4px_24px_rgba(41,24,79,0.25)]"
      style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 transition active:bg-white/30"
            type="button"
            aria-label="Go back"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold leading-tight tracking-tight sm:text-xl">
              File Exchange
            </p>
            <p className="truncate text-[11px] font-medium text-white/70">
              Task #{taskId}
              {taskTitle ? ` · ${taskTitle}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 transition active:bg-white/30"
            aria-label="Refresh files"
            onClick={onRefresh}
          >
            <Loader2 className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="shrink-0 rounded-full bg-emerald-500/80 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white sm:px-3 sm:text-[11px]">
            {role === "tasker" ? "TASKER" : "CLIENT"}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/10 px-3 py-2">
        <CheckCircle2
          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
          aria-hidden="true"
        />
        <p className="text-[11px] font-semibold leading-snug text-white/80">
          {role === "client"
            ? "Upload the task brief for Tasker, then download completed work when done."
            : "Download the task brief below, complete the work, then upload your deliverable."}
        </p>
      </div>
    </header>
  );
}
