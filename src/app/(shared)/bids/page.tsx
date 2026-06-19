"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  BidsHeader,
  BidsSidebar,
  PlaceBidModal,
  ViewBidsModal,
  ChecklistModal,
  TaskBidCard,
  BottomNav,
  inferCategory,
  getTaskImageUrl,
  buildPosterProfileHref,
  getSampleChecklist,
  type FeedTask,
  type TaskCategory,
  type ChecklistItem,
} from "@/components/bid";
import { TaskFilters, CreateTaskForm } from "@/components/task";
import { formatRelativeTime } from "@/lib/format";
import { tasksApi } from "@/lib/api/tasks";
import { bidsApi } from "@/lib/api/bids";
import { useTaskForm } from "@/hooks/use-task-form";
import {
  readActiveRole,
  readBaseUrl,
  readSessions,
  removeSession,
} from "@/lib/session-store";
import type { Bid, Role, Session, Task, TaskPhase } from "@/lib/types";

export default function BidsPage() {
  const [clientSession, setClientSession] = useState<Session>();
  const [taskerSession, setTaskerSession] = useState<Session>();
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [liveTasks, setLiveTasks] = useState<Task[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [activeCategory, setActiveCategory] = useState<TaskCategory>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState<"best" | "budget">("best");
  const [selectedTask, setSelectedTask] = useState<FeedTask | null>(null);
  const [bidAmount, setBidAmount] = useState("500");
  const [bidMessage, setBidMessage] = useState(
    "I can complete this on time and share updates.",
  );
  const [reviewTask, setReviewTask] = useState<FeedTask | null>(null);
  const [checklistTask, setChecklistTask] = useState<FeedTask | null>(null);
  const router = useRouter();
  const isClient = activeRole === "client";
  const isTasker = activeRole === "tasker";
  const [selectedBidId, setSelectedBidId] = useState<number | null>(null);

  const [notificationCount, setNotificationCount] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(true);
  const form = useTaskForm({
    title: "Write 5 product descriptions",
    location: "Remote",
    budget: "500",
    deadline: "2026-05-10T14:00",
    description:
      "Need someone to write clear, engaging product descriptions for an e-commerce store.",
  });
  const [customChecklistByTaskId, setCustomChecklistByTaskId] = useState<
    Record<number, ChecklistItem[]>
  >({});
  const [status, setStatus] = useState(
    "Browse digital tasks, view bids, and place an offer.",
  );
  const [tone, setTone] = useState<"neutral" | "success" | "error">("neutral");
  const [busy, setBusy] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const syncSessionState = useCallback(
    (triggerLoadTasks: (s: Session, role: Role) => void) => {
      const sessions = readSessions();
      const nextActiveRole = readActiveRole();
      setActiveRole(nextActiveRole);
      setClientSession(
        nextActiveRole === "client" ? sessions.client : undefined,
      );
      setTaskerSession(
        nextActiveRole === "tasker" ? sessions.tasker : undefined,
      );
      if (nextActiveRole === "tasker" && sessions.tasker) {
        triggerLoadTasks(sessions.tasker, "tasker");
      } else if (nextActiveRole === "client" && sessions.client) {
        triggerLoadTasks(sessions.client, "client");
      }
    },
    [],
  );

  const loadPublicTasks = useCallback(async () => {
    // Load tasks as public guest (no auth required)
    setBusy("tasks");
    try {
      const response = await fetch(`${readBaseUrl()}/tasks/browse`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        setLiveTasks(Array.isArray(data) ? data : (data.data ?? []));
        setTone("success");
        setStatus("Browse available tasks below.");
      } else {
        throw new Error("Failed to load tasks");
      }
    } catch (error) {
      setTone("neutral");
      setStatus("Browse sample tasks or sign in to see live tasks.");
      setLiveTasks([
        {
          id: 1,
          title: "Write 5 Product Descriptions",
          description:
            "Need clear, engaging product descriptions for e-commerce",
          budget: 500,
          status: "open",
          owner_name: "John Seller",
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          title: "Design Logo for Startup",
          description: "Professional logo design in multiple formats",
          budget: 1200,
          status: "open",
          owner_name: "Sarah Designer",
          created_at: new Date().toISOString(),
        },
      ] as Task[]);
    }
    setBusy(null);
  }, []);

  const loadTasks = useCallback(
    async (session: Session, role: Role) => {
      setBusy("tasks");
      const response =
        role === "client"
          ? await tasksApi.myTasks(readBaseUrl(), session.token)
          : await tasksApi.browseTasks(readBaseUrl(), session.token);
      setBusy(null);
      if (response.ok && response.data) {
        setLiveTasks(response.data);
        setTone("success");
        setStatus(
          role === "client"
            ? "Your posted tasks are up to date."
            : "Live task list updated.",
        );
      } else {
        const authRejected =
          response.status === 401 ||
          response.status === 403 ||
          // The backend still reports its original role names in error text.
          /only\s+(tasker|taskarmy)\s+users/i.test(response.error ?? "");
        if (authRejected) {
          removeSession(role);
          setActiveRole(null);
          setClientSession(undefined);
          setTaskerSession(undefined);
          setTone("error");
          setStatus(
            response.status === 401
              ? "Your session expired. Please log in again."
              : "Your saved session doesn't match this role. Please log in again.",
          );
          router.push("/login");
          return;
        }
        setTone("error");
        setStatus(response.error ?? "Could not load tasks.");
      }
    },
    [router],
  );

  const refreshMyBids = useCallback(async () => {
    if (!taskerSession) {
      setTone("neutral");
      setStatus("Login as Tasker to load your real bids.");
      return;
    }
    setBusy("bids");
    const response = await bidsApi.myBids(
      readBaseUrl(),
      taskerSession.token,
    );
    setBusy(null);
    if (response.ok && response.data) {
      setBids(response.data);
      setTone("success");
      setStatus("Your bids are up to date.");
    } else {
      if (response.status === 401 || response.status === 403) {
        removeSession("tasker");
        setActiveRole(null);
        setTaskerSession(undefined);
        setBids([]);
        setTone("error");
        setStatus("Your session expired. Please log in again.");
        router.push("/login");
        return;
      }
      setTone("error");
      setStatus(response.error ?? "Could not load bids.");
    }
  }, [router, taskerSession]);

  useEffect(() => {
    syncSessionState(loadTasks);
    // If no active role, load public tasks
    const nextActiveRole = readActiveRole();
    if (!nextActiveRole) {
      loadPublicTasks();
    }
    const handleSync = () => syncSessionState(loadTasks);
    window.addEventListener("focus", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [syncSessionState, loadTasks, loadPublicTasks]);

  // ✅ AUTO-REFRESH FOR TASKER USERS - This ensures newly created tasks appear
  useEffect(() => {
    if (isTasker && taskerSession) {
      // Initial load
      loadTasks(taskerSession, "tasker");

      // Auto-refresh every 15 seconds for Tasker users
      const intervalId = setInterval(() => {
        loadTasks(taskerSession, "tasker");
      }, 15000); // Refresh every 15 seconds

      return () => clearInterval(intervalId);
    }
  }, [isTasker, taskerSession, loadTasks]);

  function handleLogout() {
    if (activeRole) removeSession(activeRole);
    setActiveRole(null);
    setClientSession(undefined);
    setTaskerSession(undefined);
    setBids([]);
    setLiveTasks([]);
    router.push("/login");
  }

  const feedTasks = useMemo(() => {
    return liveTasks.map((task): FeedTask => {
      const category = inferCategory(task.title, task.description);
      const posterName =
        task.tasker_name ??
        task.owner_name ??
        task.poster?.full_name ??
        task.poster?.name ??
        task.owner?.full_name ??
        task.owner?.name ??
        task.posted_by ??
        task.poster?.email ??
        task.owner_email ??
        "Unknown";
      const posterId =
        task.owner_id ?? task.poster?.id ?? task.owner?.id ?? task.id;
      const taskOffers = task.bids?.length ?? 1;
      return {
        id: task.id,
        title: task.title,
        description: task.description ?? "No description added yet.",
        category,
        location: task.owner_name ?? task.poster?.full_name ?? "Remote",
        posterName,
        posterProfileHref: buildPosterProfileHref(task, posterId, posterName),
        time: task.deadline
          ? new Date(task.deadline).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "Open now",
        postedAgo: formatRelativeTime(task.created_at, nowTick),
        budget: task.budget,
        offers: taskOffers,
        imageUrl: getTaskImageUrl(task),
        checklist:
          customChecklistByTaskId[task.id] ?? getSampleChecklist(category),
        liveTask: task,
      };
    });
  }, [liveTasks, nowTick, customChecklistByTaskId]);

  const visibleTasks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return feedTasks
      .filter(
        (task) => activeCategory === "All" || task.category === activeCategory,
      )
      .filter(
        (task) =>
          !query ||
          `${task.title} ${task.category} ${task.location}`
            .toLowerCase()
            .includes(query),
      )
      .sort((left, right) => {
        if (sortMode === "budget") return right.budget - left.budget;
        return 0;
      });
  }, [activeCategory, feedTasks, searchTerm, sortMode]);

  function openBidSheet(task: FeedTask) {
    setSelectedTask(task);
    setBidAmount(String(task.budget));
    setBidMessage(`I can handle "${task.title}" by ${task.time}.`);
  }

  async function uploadFilesForTask(
    taskId: number,
    token: string,
    files: File[],
  ) {
    const progress: Record<string, "uploading" | "done" | "error"> = {};
    for (const file of files) {
      progress[file.name] = "uploading";
      form.setUploadProgress({ ...progress });
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(
          `${readBaseUrl().replace(/\/$/, "")}/files/upload?task_id=${taskId}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          },
        );
        progress[file.name] = response.ok ? "done" : "error";
      } catch {
        progress[file.name] = "error";
      }
      form.setUploadProgress({ ...progress });
    }
    setTimeout(() => form.setUploadProgress({}), 3000);
  }

  // ✅ Creates a real task and keeps both role views in sync
  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientSession) {
      setTone("error");
      setStatus("Login as Client to create a real task.");
      return;
    }
    setBusy("create");
    const response = await tasksApi.createTask(
      readBaseUrl(),
      clientSession.token,
      {
        title: form.title,
        description: form.description,
        budget: Number(form.budget),
        deadline: new Date(form.deadline).toISOString(),
      },
    );
    if (response.ok && response.data) {
      const createdTask = response.data as Task;

      setCustomChecklistByTaskId((current) => ({
        ...current,
        [createdTask.id]: form.checklist,
      }));

      if (form.files.length > 0) {
        setTone("neutral");
        setStatus(
          `Task #${createdTask.id} created. Uploading ${form.files.length} file(s)...`,
        );
        await uploadFilesForTask(
          createdTask.id,
          clientSession.token,
          form.files,
        );
      }

      // Add new task to the top of the feed for Client view
      setLiveTasks((current) => [
        createdTask,
        ...current.filter((task) => task.id !== createdTask.id),
      ]);

      // If Tasker is also logged in, refresh their view so the new task appears
      if (taskerSession) {
        const browseResponse = await tasksApi.browseTasks(
          readBaseUrl(),
          taskerSession.token,
        );
        if (browseResponse.ok && browseResponse.data) {
          setLiveTasks(browseResponse.data);
        }
      }

      // Reset all form fields
      form.reset();

      // Show "All" so the new task is visible, collapse form so user sees the feed
      setActiveCategory("All");
      setShowCreateTask(false);

      setNotificationCount((count) => count + 1);
      setTone("success");
      setStatus(
        form.files.length > 0
          ? `Task #${createdTask.id} created with ${form.files.length} file(s) attached.`
          : `Task #${createdTask.id} created and added to the bids feed.`,
      );
    } else {
      setTone("error");
      setStatus(response.error ?? "Could not create task.");
    }
    setBusy(null);
  }

  async function placeBid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTask) return;
    if (!taskerSession) {
      setTone("error");
      setStatus("Login as Tasker to place a real bid.");
      return;
    }
    setBusy("place");
    const response = await bidsApi.placeBid(
      readBaseUrl(),
      taskerSession.token,
      selectedTask.id,
      { amount: Number(bidAmount), message: bidMessage },
    );
    setBusy(null);
    if (response.ok) {
      setTone("success");
      setStatus(`Bid #${response.data?.id ?? ""} placed.`);
      setSelectedTask(null);
      setNotificationCount((count) => count + 1);
      await refreshMyBids();
    } else {
      setTone("error");
      setStatus(response.error ?? "Could not place bid.");
    }
  }

  async function updateBidReview(action: "accept" | "reject") {
    if (!reviewTask || selectedBidId === null) return;
    if (!clientSession) {
      setTone("error");
      setStatus("Login as Client to review real bids.");
      return;
    }
    setBusy(action);
    const response = await bidsApi[action === "accept" ? "acceptBid" : "rejectBid"](
      readBaseUrl(),
      clientSession.token,
      reviewTask.id,
      selectedBidId,
    );
    setBusy(null);
    setTone(response.ok ? "success" : "error");
    setStatus(
      response.ok
        ? `Bid ${action === "accept" ? "accepted" : "rejected"}.`
        : (response.error ?? `Could not ${action} bid.`),
    );
    if (response.ok) setReviewTask(null);
  }

  async function updateTaskPhase(task: FeedTask, phase: TaskPhase) {
    if (!clientSession) {
      setTone("error");
      setStatus("Login as Client to update a real task.");
      return;
    }
    setBusy(`phase-${task.id}`);
    const response = await tasksApi.updateTask(
      readBaseUrl(),
      clientSession.token,
      task.id,
      { status: phase },
    );
    setBusy(null);
    setTone(response.ok ? "success" : "error");
    setStatus(
      response.ok
        ? `Task phase updated to ${phase.replace("_", " ")}.`
        : (response.error ?? "Could not update task phase."),
    );
  }

  const roleLabel = isClient ? "Client" : isTasker ? "Tasker" : null;
  const activeSession = isClient
    ? clientSession
    : isTasker
      ? taskerSession
      : undefined;
  const getTaskBids = (task: FeedTask) =>
    task.liveTask?.bids?.length
      ? task.liveTask.bids
      : bids.filter((bid) => bid.task_id === task.id);
  const reviewBids = reviewTask ? getTaskBids(reviewTask) : [];

  return (
    <>
      <div className="min-h-screen w-full bg-[#f8f6ff]">
        <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Sidebar */}
          <BidsSidebar
            activeRole={activeRole}
            activeSession={activeSession}
            status={status}
            onHome={() => {
              router.push("/bids");
              setStatus("Home feed selected.");
            }}
            onBrowseTasks={() =>
              setStatus(`${visibleTasks.length} tasks visible.`)
            }
            onReviewBids={() =>
              setStatus("Click 'View Bids' on any task card.")
            }
            onMyBids={() => router.push("/mybids")}
            onMessages={() => setStatus("No unread messages.")}
            onLogout={handleLogout}
            onLogin={() => router.push("/login")}
          />

          {/* Main content */}
          <div className="overflow-hidden">
            <div className="min-h-screen w-full overflow-hidden bg-[#f8f6ff]">
              {/* Header */}
              <BidsHeader
                activeRole={roleLabel}
                activeSession={activeSession}
                notificationCount={notificationCount}
                onNotifications={() => {
                  setNotificationCount(0);
                  setStatus("Notifications cleared.");
                }}
                onLogout={handleLogout}
                onMenu={() => setShowMenu((v) => !v)}
                showMenu={showMenu}
              />

              {/* Main content area */}
              <main className="pb-24">
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
                        onClick={() => router.push("/login")}
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
                  onSearchChange={setSearchTerm}
                  onCategoryChange={setActiveCategory}
                  onSortChange={setSortMode}
                  onToggleFilters={() => setShowFilters((v) => !v)}
                />

                {/* Create task form */}
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
                      onChecklistItemDescriptionChange={
                        form.changeChecklistItemDescription
                      }
                      onSubmit={createTask}
                    />
                  </section>
                )}

                {/* Create task button */}
                {isClient && (
                  <section className="border-b border-[#ded7ee] bg-white/60 px-4 py-3">
                    <button
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#4f22bd] text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(79,34,189,0.28)]"
                      type="button"
                      onClick={() => setShowCreateTask((v) => !v)}
                    >
                      <Plus className="h-5 w-5" aria-hidden="true" />
                      {showCreateTask ? "Hide Create Task" : "Create Task"}
                    </button>
                  </section>
                )}

                {/* Info message for Tasker */}
                {isTasker && (
                  <section className="border-b border-[#ded7ee] bg-white/60 px-4 py-3">
                    <div className="rounded-lg border border-[#ded7ee] bg-white px-4 py-3 text-sm font-semibold text-[#6d668a]">
                      Browse digital tasks below and tap{" "}
                      <strong className="text-[#4f22bd]">Place Bid</strong> to
                      send your offer. Tasks refresh automatically every 15
                      seconds.
                    </div>
                  </section>
                )}

                {/* Status message */}
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
                          bids.filter((bid) => bid.task_id === task.id)
                            .length || task.offers
                        }
                        onPlaceBid={() => openBidSheet(task)}
                        onViewBids={() => {
                          const taskBids = getTaskBids(task);
                          setReviewTask(task);
                          setSelectedBidId(taskBids[0]?.id ?? null);
                        }}
                        onOpenChecklist={() => setChecklistTask(task)}
                        onComplete={() =>
                          void updateTaskPhase(task, "completed")
                        }
                        onFiles={() => router.push(`/task/${task.id}/files`)}
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

              {/* Bottom navigation */}
              <BottomNav
                isClient={isClient}
                isTasker={isTasker}
                roleLabel={roleLabel}
                onHome={() => {
                  router.push("/");
                  setStatus("Home feed selected.");
                }}
                onBrowseTasks={() =>
                  setStatus(`${visibleTasks.length} tasks visible.`)
                }
                onPost={() => {
                  setShowCreateTask(true);
                  setStatus("Create task form opened.");
                }}
                onMyBids={() => router.push("/mybids")}
                onMessages={() => setStatus("No unread messages.")}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedTask && isTasker && (
        <PlaceBidModal
          selectedTask={selectedTask}
          bidAmount={bidAmount}
          bidMessage={bidMessage}
          busy={busy === "place"}
          onAmountChange={setBidAmount}
          onMessageChange={setBidMessage}
          onSubmit={placeBid}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {reviewTask && isClient && (
        <ViewBidsModal
          reviewTask={reviewTask}
          reviewBids={reviewBids}
          selectedBidId={selectedBidId}
          busy={busy}
          onSelectBid={setSelectedBidId}
          onReject={() => void updateBidReview("reject")}
          onAccept={() => void updateBidReview("accept")}
          onClose={() => setReviewTask(null)}
        />
      )}

      {checklistTask && (
        <ChecklistModal
          checklistTask={checklistTask}
          onClose={() => setChecklistTask(null)}
        />
      )}
    </>
  );
}
