import { CloudUpload, Loader2 } from "lucide-react";
import type { DragEvent } from "react";

export function DropZone({
  dragging,
  uploading,
  uploadProgress,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  label = "Drag & drop files here",
}: {
  dragging: boolean;
  uploading: boolean;
  uploadProgress: number;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent) => void;
  onClick: () => void;
  label?: string;
}) {
  return (
    <>
      <div
        className={`mb-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-3 py-6 transition-all sm:py-7 ${
          dragging
            ? "border-[#4f22bd] bg-[#4f22bd]/5"
            : "border-[#ded7ee] bg-[#f8f6ff] hover:border-[#4f22bd]/50"
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
      >
        <CloudUpload
          className={`mb-2 h-8 w-8 sm:h-9 sm:w-9 ${dragging ? "text-[#4f22bd]" : "text-[#ded7ee]"}`}
        />
        <p className="text-center text-sm font-extrabold text-[#21145f]">
          {dragging ? "Drop files here!" : label}
        </p>
        <p className="mt-1 text-xs font-semibold text-[#786fa0]">
          or tap to browse
        </p>
      </div>
      {uploading && (
        <div className="mb-3">
          <div className="h-2 overflow-hidden rounded-full bg-[#ded7ee]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4f22bd] to-[#8B5CF6] transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-1.5 flex items-center justify-center gap-1 text-xs font-bold text-[#786fa0]">
            <Loader2 className="h-3 w-3 animate-spin" /> Uploading…{" "}
            {uploadProgress}%
          </p>
        </div>
      )}
    </>
  );
}
