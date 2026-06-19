import { Download, Trash2 } from "lucide-react";
import type { TaskFile } from "@/lib/task-files";
import { extColor, fileIcon } from "@/components/task-files/file-icon";

export function FileList({
  files,
  emptyText,
  onDelete,
  showDelete,
}: {
  files: TaskFile[];
  emptyText: string;
  onDelete?: (id: string) => void;
  showDelete: boolean;
}) {
  if (files.length === 0) {
    return emptyText ? (
      <p className="py-3 text-center text-xs font-semibold text-[#9CA3AF]">
        {emptyText}
      </p>
    ) : null;
  }

  return (
    <div className="space-y-2">
      {files.map((f) => {
        const ext = f.type;
        const color = extColor(ext);
        return (
          <div
            key={f.id}
            className="flex items-center gap-2 rounded-xl border border-[#f0ecfa] bg-[#faf9ff] px-2.5 py-2 sm:gap-3 sm:px-3 sm:py-2.5"
          >
            <span className="shrink-0 text-xl sm:text-2xl">
              {fileIcon(ext)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-extrabold text-[#21145f] sm:text-sm">
                {f.name}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] font-semibold text-[#9CA3AF] sm:text-[11px]">
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-extrabold"
                  style={{ background: color + "22", color }}
                >
                  {ext.toUpperCase()}
                </span>
                {f.size && <span className="shrink-0">{f.size}</span>}
                <span className="truncate">{f.uploadedAt}</span>
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <a
                href={f.url}
                download={f.name}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4f22bd]/10 text-[#4f22bd] transition active:bg-[#4f22bd]/30 sm:h-8 sm:w-8"
              >
                <Download className="h-4 w-4" />
              </a>
              {showDelete && onDelete && (
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-400 transition active:bg-red-100 sm:h-8 sm:w-8"
                  onClick={() => onDelete(f.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
