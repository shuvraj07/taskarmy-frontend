"use client";

import {
  ClipboardList,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react";
import type { TaskCategory } from "@/components/bid/types";

const categories: Array<{ label: TaskCategory; icon?: typeof ClipboardList }> =
  [
    { label: "All" },
    { label: "Data Entry", icon: ClipboardList },
    { label: "Content Writing", icon: MessageCircle },
    { label: "Design", icon: Sparkles },
    { label: "Media & Social", icon: Zap },
  ];

export function TaskFilters({
  searchTerm,
  activeCategory,
  sortMode,
  showFilters,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onToggleFilters,
}: {
  searchTerm: string;
  activeCategory: TaskCategory;
  sortMode: "best" | "budget";
  showFilters: boolean;
  onSearchChange: (v: string) => void;
  onCategoryChange: (v: TaskCategory) => void;
  onSortChange: (v: "best" | "budget") => void;
  onToggleFilters: () => void;
}) {
  return (
    <section className="space-y-4 border-b border-[#ded7ee] bg-white/60 px-4 py-5">
      <form
        className="flex overflow-hidden rounded-lg border border-[#ded7ee] bg-white shadow-[0_8px_22px_rgba(41,24,79,0.1)]"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          id="task-search"
          className="min-h-16 min-w-0 flex-1 px-4 text-base font-medium text-[#21145f] outline-none placeholder:text-[#8d86aa]"
          placeholder="Search tasks, skills, or categories..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button
          className="flex w-20 items-center justify-center bg-[#4f22bd] text-white"
          type="submit"
          aria-label="Search tasks"
        >
          <Search className="h-8 w-8" aria-hidden="true" />
        </button>
        <button
          className="ml-3 flex w-16 items-center justify-center rounded-lg bg-[#4f22bd] text-white shadow-[0_8px_18px_rgba(79,34,189,0.28)]"
          type="button"
          aria-label="Open filters"
          onClick={onToggleFilters}
        >
          <SlidersHorizontal className="h-7 w-7" aria-hidden="true" />
        </button>
      </form>

      {showFilters && (
        <div className="rounded-lg border border-[#ded7ee] bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#786fa0]">
            Sort tasks
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["best", "budget"] as const).map((mode) => (
              <button
                key={mode}
                className={`rounded-md px-3 py-2 text-sm font-bold capitalize ${sortMode === mode ? "bg-[#4f22bd] text-white" : "bg-[#f4efff] text-[#21145f]"}`}
                onClick={() => onSortChange(mode)}
                type="button"
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((category) => {
          const Icon = category.icon;
          const active = activeCategory === category.label;
          return (
            <button
              key={category.label}
              className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border px-5 text-sm font-bold shadow-sm transition ${active ? "border-[#4f22bd] bg-[#4f22bd] text-white" : "border-[#ded7ee] bg-white text-[#21145f]"}`}
              type="button"
              onClick={() => onCategoryChange(category.label)}
            >
              {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
              {category.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
