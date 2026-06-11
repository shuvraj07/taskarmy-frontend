"use client";

import { Check, ListChecks, Plus, Upload, X } from "lucide-react";
import { FormEvent } from "react";
import type { ChecklistItem, TaskCategory } from "./types";
import { formatFileSize, getFileEmoji, getSampleChecklist } from "./helpers";

const categories: Array<{ label: TaskCategory; icon?: React.ComponentType }> = [
  { label: "All" },
  { label: "Data Entry" },
  { label: "Content Writing" },
  { label: "Design" },
  { label: "Media & Social" },
];

export function CreateTaskForm({
  title,
  category,
  location,
  budget,
  deadline,
  description,
  files,
  uploadProgress,
  checklist,
  busy,
  onTitleChange,
  onCategoryChange,
  onLocationChange,
  onBudgetChange,
  onDeadlineChange,
  onDescriptionChange,
  onFilesChange,
  onChecklistChange,
  onAddChecklistItem,
  onRemoveChecklistItem,
  onChecklistItemLabelChange,
  onChecklistItemDescriptionChange,
  onSubmit,
}: {
  title: string;
  category: Exclude<TaskCategory, "All">;
  location: string;
  budget: string;
  deadline: string;
  description: string;
  files: File[];
  uploadProgress: Record<string, "uploading" | "done" | "error">;
  checklist: ChecklistItem[];
  busy: boolean;
  onTitleChange: (v: string) => void;
  onCategoryChange: (v: Exclude<TaskCategory, "All">) => void;
  onLocationChange: (v: string) => void;
  onBudgetChange: (v: string) => void;
  onDeadlineChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onFilesChange: (files: File[]) => void;
  onChecklistChange: (items: ChecklistItem[]) => void;
  onAddChecklistItem: () => void;
  onRemoveChecklistItem: (id: string) => void;
  onChecklistItemLabelChange: (id: string, value: string) => void;
  onChecklistItemDescriptionChange: (id: string, value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      className="rounded-lg border border-[#ded7ee] bg-white p-4 shadow-[0_8px_22px_rgba(41,24,79,0.1)]"
      onSubmit={onSubmit}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#786fa0]">
            Create digital task
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-[#21145f]">
            Post a task to bids
          </h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f4efff] text-[#4f22bd]">
          <Plus className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <FormField label="Task title">
          <input
            className="mt-1 min-h-11 w-full rounded-md border border-[#ded7ee] bg-[#fbfaff] px-3 text-sm font-semibold text-[#21145f] outline-none focus:border-[#4f22bd]"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g. Design a logo for my brand"
            required
          />
        </FormField>
        <FormField label="Category">
          <select
            className="mt-1 min-h-11 w-full rounded-md border border-[#ded7ee] bg-[#fbfaff] px-3 text-sm font-semibold text-[#21145f] outline-none focus:border-[#4f22bd]"
            value={category}
            onChange={(e) =>
              onCategoryChange(e.target.value as Exclude<TaskCategory, "All">)
            }
          >
            {categories
              .filter(
                (
                  item,
                ): item is {
                  label: Exclude<TaskCategory, "All">;
                  icon?: React.ComponentType;
                } => item.label !== "All",
              )
              .map((item) => (
                <option key={item.label} value={item.label}>
                  {item.label}
                </option>
              ))}
          </select>
        </FormField>
        <FormField label="Delivery method">
          <input
            className="mt-1 min-h-11 w-full rounded-md border border-[#ded7ee] bg-[#fbfaff] px-3 text-sm font-semibold text-[#21145f] outline-none focus:border-[#4f22bd]"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="e.g. Remote / Google Drive / Email"
            required
          />
        </FormField>
        <FormField label="Budget (Rs)">
          <input
            className="mt-1 min-h-11 w-full rounded-md border border-[#ded7ee] bg-[#fbfaff] px-3 text-sm font-semibold text-[#21145f] outline-none focus:border-[#4f22bd]"
            min="1"
            type="number"
            value={budget}
            onChange={(e) => onBudgetChange(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Deadline">
          <input
            className="mt-1 min-h-11 w-full rounded-md border border-[#ded7ee] bg-[#fbfaff] px-3 text-sm font-semibold text-[#21145f] outline-none focus:border-[#4f22bd]"
            type="datetime-local"
            value={deadline}
            onChange={(e) => onDeadlineChange(e.target.value)}
            required
          />
        </FormField>
        <label className="md:col-span-2">
          <span className="text-xs font-bold uppercase tracking-wide text-[#786fa0]">
            Description
          </span>
          <textarea
            className="mt-1 min-h-20 w-full resize-none rounded-md border border-[#ded7ee] bg-[#fbfaff] px-3 py-2 text-sm font-semibold text-[#21145f] outline-none focus:border-[#4f22bd]"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe the task in detail — tools needed, format of deliverable, reference files, etc."
          />
        </label>

        {/* File attachments */}
        <div className="md:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[#786fa0]">
            Attach files{" "}
            <span className="font-semibold normal-case text-[#8d86aa]">
              (optional — reference docs, briefs, assets)
            </span>
          </p>

          <label className="mt-1 flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-[#c4b8ef] bg-[#f8f6ff] px-4 py-3 text-center transition hover:border-[#4f22bd] hover:bg-[#f0ecff]">
            <Upload className="h-5 w-5 text-[#4f22bd]" aria-hidden="true" />
            <span className="text-sm font-bold text-[#4f22bd]">
              Click to attach files
            </span>
            <span className="text-xs font-semibold text-[#8d86aa]">
              PDF, Word, Excel, images, ZIP — max 20 MB each
            </span>
            <input
              type="file"
              multiple
              className="sr-only"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.txt,.csv"
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                onFilesChange([...files, ...picked]);
                e.target.value = "";
              }}
            />
          </label>

          {files.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {files.map((file, i) => {
                const prog = uploadProgress[file.name];
                return (
                  <li
                    key={`${file.name}-${i}`}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition ${
                      prog === "done"
                        ? "border-emerald-200 bg-emerald-50"
                        : prog === "error"
                          ? "border-red-200 bg-red-50"
                          : prog === "uploading"
                            ? "border-[#c4b8ef] bg-[#f4efff]"
                            : "border-[#ded7ee] bg-white"
                    }`}
                  >
                    <span className="shrink-0 text-lg leading-none">
                      {getFileEmoji(file.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#21145f]">
                        {file.name}
                      </p>
                      <p className="text-xs text-[#786fa0]">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    {prog === "uploading" && (
                      <span className="shrink-0 text-xs font-bold text-[#4f22bd]">
                        Uploading…
                      </span>
                    )}
                    {prog === "done" && (
                      <Check
                        className="h-4 w-4 shrink-0 text-emerald-600"
                        aria-label="Uploaded"
                      />
                    )}
                    {prog === "error" && (
                      <span className="shrink-0 text-xs font-bold text-red-500">
                        Failed
                      </span>
                    )}
                    {!prog && (
                      <button
                        type="button"
                        className="ml-1 shrink-0 rounded p-0.5 text-[#786fa0] transition hover:bg-red-50 hover:text-red-500"
                        aria-label={`Remove ${file.name}`}
                        onClick={() =>
                          onFilesChange(files.filter((_, idx) => idx !== i))
                        }
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Checklist editor */}
      <div className="mt-4 rounded-lg border border-[#ded7ee] bg-[#f8f6ff] p-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#786fa0]">
          <ListChecks className="h-4 w-4" aria-hidden="true" />
          Checklist
        </div>

        {checklist.length === 0 ? (
          <div className="mt-3 rounded-md border border-dashed border-[#c4b8ef] bg-white p-4 text-sm font-semibold text-[#6d668a]">
            No checklist items yet. Add one to guide TaskArmy work.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {checklist.map((item, index) => (
              <div
                key={item.id}
                className="rounded-md border border-[#ded7ee] bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#786fa0]">
                      Item {index + 1}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-500 transition hover:text-red-700"
                    onClick={() => onRemoveChecklistItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
                <label className="block">
                  <span className="text-sm font-bold text-[#21145f]">
                    Label
                  </span>
                  <input
                    className="mt-1 min-h-11 w-full rounded-md border border-[#ded7ee] bg-[#fbfaff] px-3 text-sm font-semibold text-[#21145f] outline-none focus:border-[#4f22bd]"
                    value={item.label}
                    onChange={(e) =>
                      onChecklistItemLabelChange(item.id, e.target.value)
                    }
                    placeholder="Example: Confirm design files"
                    required
                  />
                </label>
                <label className="mt-3 block">
                  <span className="text-sm font-bold text-[#21145f]">
                    Description
                  </span>
                  <textarea
                    className="mt-1 min-h-20 w-full resize-none rounded-md border border-[#ded7ee] bg-[#fbfaff] px-3 py-2 text-sm font-semibold text-[#21145f] outline-none focus:border-[#4f22bd]"
                    value={item.description}
                    onChange={(e) =>
                      onChecklistItemDescriptionChange(item.id, e.target.value)
                    }
                    placeholder="Describe what TaskArmy should check before delivery"
                  />
                </label>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#4f22bd] px-4 py-2 text-sm font-bold text-white"
          onClick={onAddChecklistItem}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add checklist item
        </button>
      </div>

      <button
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#4f22bd] text-sm font-extrabold text-white disabled:opacity-60"
        disabled={busy}
        type="submit"
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
        {busy
          ? files.length > 0
            ? "Creating & uploading..."
            : "Creating..."
          : files.length > 0
            ? `Create Task + Upload ${files.length} file${files.length > 1 ? "s" : ""}`
            : "Create Task"}
      </button>
    </form>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="text-xs font-bold uppercase tracking-wide text-[#786fa0]">
        {label}
      </span>
      {children}
    </label>
  );
}
