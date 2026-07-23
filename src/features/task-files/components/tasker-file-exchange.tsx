import { useRef, useState } from "react";
import { CheckCircle2, FolderOpen } from "lucide-react";
import type { TaskFile } from "../services/task-files";
import type { TaskerStep } from "../hooks/use-tasker-step-machine";
import { DropZone } from "./drop-zone";
import { LockedMessage } from "./empty-states";
import { FileList } from "./file-list";
import { Section } from "./section";
import { StepIndicator } from "./step-indicator";

export function TaskerFileExchange({
  step,
  briefFiles,
  submittedFiles,
  hasUploadedWork,
  uploading,
  uploadProgress,
  submitting,
  onConfirmDownload,
  onUploadWork,
  onDeleteFile,
  onSubmit,
  onRefresh,
}: {
  step: TaskerStep;
  briefFiles: TaskFile[];
  submittedFiles: TaskFile[];
  hasUploadedWork: boolean;
  uploading: boolean;
  uploadProgress: number;
  submitting: boolean;
  onConfirmDownload: () => void;
  onUploadWork: (files: FileList | null) => void;
  onDeleteFile: (id: string) => void;
  onSubmit: () => void;
  onRefresh: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const workInputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    onUploadWork(e.dataTransfer.files);
  }

  return (
    <>
      <StepIndicator currentStep={step} />

      <Section
        title="📥 Step 1 — Download Task Brief"
        subtitle="Download and read all files from the Client before starting"
        highlight={step === "download"}
      >
        {briefFiles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-5 text-center">
            <FolderOpen className="h-10 w-10 text-[#ded7ee]" />
            <p className="text-xs font-semibold text-[#9CA3AF]">
              No brief files available yet.
            </p>
            <p className="text-xs text-[#9CA3AF]">
              The Client needs to upload the task brief first.
            </p>
            <button
              type="button"
              className="mt-2 rounded-lg border border-[#4f22bd] bg-white px-4 py-2 text-xs font-bold text-[#4f22bd] transition hover:bg-[#f4efff]"
              onClick={onRefresh}
            >
              🔄 Refresh
            </button>
          </div>
        ) : (
          <>
            <FileList files={briefFiles} emptyText="" showDelete={false} />
            {step === "download" && (
              <button
                type="button"
                className="mt-3 w-full rounded-xl bg-[#4f22bd] py-3 text-sm font-extrabold text-white transition hover:bg-[#3a1696]"
                onClick={onConfirmDownload}
              >
                📥 I&apos;ve Downloaded &amp; Read the Brief
              </button>
            )}
          </>
        )}
      </Section>

      <Section
        title="📤 Step 2 — Upload Completed Work"
        subtitle="Upload your deliverable after finishing the task"
        highlight={step === "upload"}
        locked={step === "download"}
      >
        {step === "download" ? (
          <LockedMessage text="Download the task brief first to unlock this section" />
        ) : step === "submitted" ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
            <p className="font-extrabold text-emerald-700">Work Submitted!</p>
            <p className="mt-1 text-xs font-semibold text-emerald-600">
              Client will review your submission shortly.
            </p>
            {submittedFiles.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-left text-xs font-extrabold uppercase tracking-wide text-[#786fa0]">
                  Your submitted files
                </p>
                <FileList
                  files={submittedFiles}
                  emptyText=""
                  showDelete={false}
                />
              </div>
            )}
          </div>
        ) : (
          <>
            <DropZone
              dragging={dragging}
              uploading={uploading}
              uploadProgress={uploadProgress}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => workInputRef.current?.click()}
              label="Upload your completed work"
            />
            <input
              ref={workInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".jpg,.jpeg,.png,.webp,.pdf,.xlsx,.docx,.zip,.csv,.txt"
              onChange={(e) => onUploadWork(e.target.files)}
            />
            {(submittedFiles.length > 0 || hasUploadedWork) && !uploading && (
              <>
                <FileList
                  files={submittedFiles}
                  emptyText=""
                  onDelete={onDeleteFile}
                  showDelete
                />
                <button
                  type="button"
                  className="mt-3 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-3.5 text-sm font-extrabold text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)] transition active:opacity-80 disabled:opacity-50"
                  onClick={onSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "✅ Submit Work to Client"}
                </button>
              </>
            )}
          </>
        )}
      </Section>
    </>
  );
}
