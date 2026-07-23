import { useRef, useState } from "react";
import type { TaskFile } from "../services/task-files";
import { DropZone } from "./drop-zone";
import { EmptyWaiting } from "./empty-states";
import { FileList } from "./file-list";
import { Section } from "./section";

export function ClientFileExchange({
  briefFiles,
  submittedFiles,
  uploading,
  uploadProgress,
  reviewBusy,
  onUploadBrief,
  onDeleteFile,
  onApprove,
  onRequestRevision,
}: {
  briefFiles: TaskFile[];
  submittedFiles: TaskFile[];
  uploading: boolean;
  uploadProgress: number;
  reviewBusy: boolean;
  onUploadBrief: (files: FileList | null) => void;
  onDeleteFile: (id: string) => void;
  onApprove: () => void;
  onRequestRevision: (comment: string) => Promise<boolean>;
}) {
  const [dragging, setDragging] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const briefInputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    onUploadBrief(e.dataTransfer.files);
  }

  // Only clear the comment once the revision request actually succeeds —
  // a failed request should leave the user's text in place.
  async function handleRequestRevisionClick() {
    const succeeded = await onRequestRevision(reviewComment);
    if (succeeded) setReviewComment("");
  }

  return (
    <>
      <Section
        title="📤 Upload Task Brief"
        subtitle="Upload instructions & reference files for Tasker"
      >
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
          onClick={() => briefInputRef.current?.click()}
          label="Upload task brief for Tasker"
        />
        <input
          ref={briefInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".jpg,.jpeg,.png,.webp,.pdf,.xlsx,.docx,.zip,.csv,.txt"
          onChange={(e) => onUploadBrief(e.target.files)}
        />
        <FileList
          files={briefFiles}
          emptyText="No brief uploaded yet — upload files above for Tasker to download"
          onDelete={onDeleteFile}
          showDelete
        />
      </Section>

      <Section
        title="📥 Completed Work from Tasker"
        subtitle="Files submitted by Tasker after finishing the task"
      >
        {submittedFiles.length === 0 ? (
          <EmptyWaiting text="Waiting for Tasker to submit completed work…" />
        ) : (
          <>
            <FileList files={submittedFiles} emptyText="" showDelete={false} />
            <div className="mt-4 space-y-3 rounded-xl border border-[#ded7ee] bg-white p-4">
              <p className="text-sm font-bold text-[#21145f]">
                Review submitted work
              </p>
              <p className="text-xs font-semibold text-[#6d668a]">
                Approve the completed work or request a revision with a
                comment.
              </p>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-[#786fa0]">
                  Revision comment
                </span>
                <textarea
                  className="mt-2 min-h-[100px] w-full resize-none rounded-md border border-[#ded7ee] bg-[#fbfaff] px-3 py-2 text-sm font-semibold text-[#21145f] outline-none focus:border-[#4f22bd]"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Leave a note if you need Tasker to redo or refine the work"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="min-h-12 rounded-md bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  onClick={onApprove}
                  disabled={reviewBusy}
                >
                  {reviewBusy ? "Processing…" : "Approve work"}
                </button>
                <button
                  type="button"
                  className="min-h-12 rounded-md border border-[#ded7ee] bg-white px-4 py-3 text-sm font-extrabold text-[#371184] transition hover:bg-[#f4efff] disabled:opacity-60"
                  onClick={() => void handleRequestRevisionClick()}
                  disabled={reviewBusy}
                >
                  {reviewBusy ? "Processing…" : "Request revision"}
                </button>
              </div>
            </div>
          </>
        )}
      </Section>
    </>
  );
}
