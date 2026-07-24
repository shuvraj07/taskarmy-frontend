"use client";

import { FormEvent } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { TaskBidCard } from "./task-bid-card";
import type { FeedTask, TaskCategory } from "./types";
import { TaskFilters, CreateTaskForm } from "@/components/task";
import { useTaskForm } from "../hooks/use-task-form";
import type { Bid } from "@/lib/types";

type TaskFeedProps = {
  isClient: boolean;
  isTasker: boolean;
  showCreateTask: boolean;
  showFilters: boolean;
  searchTerm: string;
  activeCategory: TaskCategory;
  sortMode: "best" | "budget";
  visibleTasks: FeedTask[];
  bids: Bid[];
  busy: string | null;
  status: string;
  tone: "neutral" | "success" | "error";
  form: ReturnType<typeof useTaskForm>;
  onToggleCreateTask: () => void;
  onToggleFilters: () => void;
  onSearchChange: (v: string) => void;
  onCategoryChange: (v: TaskCategory) => void;
  onSortChange: (v: "best" | "budget") => void;
  onCreateTask: (e: FormEvent<HTMLFormElement>) => void;
  onPlaceBid: (task: FeedTask) => void;
  onViewBids: (task: FeedTask) => void;
  onOpenChecklist: (task: FeedTask) => void;
  onComplete: (task: FeedTask) => void;
  onViewPoster: (task: FeedTask) => void;
  onLogin: () => void;
};

export function TaskFeed({
  isClient,
  isTasker,
  showCreateTask,
  showFilters,
  searchTerm,
  activeCategory,
  sortMode,
  visibleTasks,
  bids,
  busy,
  status,
  tone,
  form,
  onToggleCreateTask,
  onToggleFilters,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onCreateTask,
  onPlaceBid,
  onViewBids,
  onOpenChecklist,
  onComplete,
  onViewPoster,
  onLogin,
}: TaskFeedProps) {
  const router = useRouter();

  return (
    <main className="pb-24">
      {/* Guest banner */}
      {!isClient && !isTasker && (
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[#ded7ee] bg-white px-4 py-3 shadow-sm">
            <p className="text-sm font-semibold text-[#6d668a]">
              👋 Browse freely.{" "}
              <span className="text-[#21145f]">
                Login to post tasks or place bids.
              </span>
            </p>
            <button
              className="shrink-0 rounded-md bg-[#4f22bd] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#3a1696]"
              type="button"
              onClick={onLogin}
            >
              Login
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <TaskFilters
        searchTerm={searchTerm}
        activeCategory={activeCategory}
        sortMode={sortMode}
        showFilters={showFilters}
        onSearchChange={onSearchChange}
        onCategoryChange={onCategoryChange}
        onSortChange={onSortChange}
        onToggleFilters={onToggleFilters}
      />

      {/* Create task form (client only, collapsible) */}
      {isClient && showCreateTask && (
        <section className="px-4 pt-4">
          <CreateTaskForm
            title={form.title}
            category={form.category}
            location={form.location}
            budget={form.budget}
            deadline={form.deadline}
            description={form.description}
            files={form.files}
            uploadProgress={form.uploadProgress}
            checklist={form.checklist}
            busy={busy === "create"}
            onTitleChange={form.setTitle}
            onCategoryChange={form.changeCategory}
            onLocationChange={form.setLocation}
            onBudgetChange={form.setBudget}
            onDeadlineChange={form.setDeadline}
            onDescriptionChange={form.setDescription}
            onFilesChange={form.setFiles}
            onChecklistChange={form.setChecklist}
            onAddChecklistItem={form.addChecklistItem}
            onRemoveChecklistItem={form.removeChecklistItem}
            onChecklistItemLabelChange={form.changeChecklistItemLabel}
            onChecklistItemDescriptionChange={form.changeChecklistItemDescription}
            onSubmit={onCreateTask}
          />
        </section>
      )}

      {/* Toggle button (client) / Info banner (tasker) */}
      {isClient && (
        <section className="border-b border-[#ded7ee] bg-white/60 px-4 py-3">
          <button
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#4f22bd] text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(79,34,189,0.28)]"
            type="button"
            onClick={onToggleCreateTask}
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            {showCreateTask ? "Hide Create Task" : "Create Task"}
          </button>
        </section>
      )}

      {isTasker && (
        <section className="border-b border-[#ded7ee] bg-white/60 px-4 py-3">
          <div className="rounded-lg border border-[#ded7ee] bg-white px-4 py-3 text-sm font-semibold text-[#6d668a]">
            Browse digital tasks below and tap{" "}
            <strong className="text-[#4f22bd]">Place Bid</strong> to send your
            offer. Tasks refresh automatically every 15 seconds.
          </div>
        </section>
      )}

      {/* Status bar */}
      <div className="px-4 py-3">
        <div
          className={`rounded-md border px-3 py-2 text-sm font-semibold ${
            tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : tone === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-[#ded7ee] bg-white text-[#6d668a]"
          }`}
        >
          {busy === "tasks" ? "Loading live tasks..." : status}
        </div>
      </div>

      {/* Task feed */}
      <section className="space-y-3 px-4">
        {visibleTasks.length === 0 ? (
          <div className="rounded-lg border border-[#ded7ee] bg-white p-6 text-center text-sm font-semibold text-[#6d668a]">
            No tasks match your search.
          </div>
        ) : (
          visibleTasks.map((task) => (
            <TaskBidCard
              key={task.id}
              task={task}
              bidCount={
                bids.filter((bid) => bid.task_id === task.id).length ||
                task.offers
              }
              onPlaceBid={() => onPlaceBid(task)}
              onViewBids={() => onViewBids(task)}
              onOpenChecklist={() => onOpenChecklist(task)}
              onComplete={() => onComplete(task)}
              onFiles={() => router.push(`/task/${task.id}/files`)}
              onViewPoster={() => onViewPoster(task)}
              canPlaceBid={isTasker}
              canViewBids={isClient}
              canComplete={isClient}
              showBidLoginPrompt={!isClient && !isTasker}
              busy={busy === `phase-${task.id}`}
            />
          ))
        )}
      </section>
    </main>
  );
}
