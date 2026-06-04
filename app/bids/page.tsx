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
  TaskFilters,
  CreateTaskForm,
  BottomNav,
  formatRelativeTime,
  inferCategory,
  getTaskImageUrl,
  buildPosterProfileHref,
  getSampleChecklist,
  type FeedTask,
  type TaskCategory,
} from "@/components/bids";
import { taskArmyApi } from "@/lib/api";
import {
  readActiveRole,
  readBaseUrl,
  readSessions,
  removeSession,
} from "@/lib/session-store";
import type { Bid, Role, Session, Task, TaskPhase } from "@/lib/types";

export default function BidsPage() {
  const [taskerSession, setTaskerSession] = useState<Session>();
  const [workerSession, setWorkerSession] = useState<Session>();
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
  const isTasker = activeRole === "tasker";
  const isTaskArmy = activeRole === "taskarmy";
  const [selectedBidId, setSelectedBidId] = useState<number | null>(null);

  const [notificationCount, setNotificationCount] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState(
    "Write 5 product descriptions",
  );
  const [newTaskCategory, setNewTaskCategory] =
    useState<Exclude<TaskCategory, "All">>("Content Writing");
  const [newTaskLocation, setNewTaskLocation] = useState("Remote");
  const [newTaskBudget, setNewTaskBudget] = useState("500");
  const [newTaskDeadline, setNewTaskDeadline] = useState("2026-05-10T14:00");
  const [newTaskDescription, setNewTaskDescription] = useState(
    "Need someone to write clear, engaging product descriptions for an e-commerce store.",
  );
  const [newTaskFiles, setNewTaskFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<
    Record<string, "uploading" | "done" | "error">
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
      setTaskerSession(
        nextActiveRole === "tasker" ? sessions.tasker : undefined,
      );
      setWorkerSession(
        nextActiveRole === "taskarmy" ? sessions.taskarmy : undefined,
      );
      if (nextActiveRole === "taskarmy" && sessions.taskarmy) {
        triggerLoadTasks(sessions.taskarmy, "taskarmy");
      } else if (nextActiveRole === "tasker" && sessions.tasker) {
        triggerLoadTasks(sessions.tasker, "tasker");
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
        role === "tasker"
          ? await taskArmyApi.myTasks(readBaseUrl(), session.token)
          : await taskArmyApi.browseTasks(readBaseUrl(), session.token);
      setBusy(null);
      if (response.ok && response.data) {
        setLiveTasks(response.data);
        setTone("success");
        setStatus(
          role === "tasker"
            ? "Your posted tasks are up to date."
            : "Live task list updated.",
        );
      } else {
        const authRejected =
          response.status === 401 ||
          response.status === 403 ||
          /only\s+(tasker|taskarmy)\s+users/i.test(response.error ?? "");
        if (authRejected) {
          removeSession(role);
          setActiveRole(null);
          setTaskerSession(undefined);
          setWorkerSession(undefined);
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
    if (!workerSession) {
      setTone("neutral");
      setStatus("Login as TaskArmy to load your real bids.");
      return;
    }
    setBusy("bids");
    const response = await taskArmyApi.myBids(
      readBaseUrl(),
      workerSession.token,
    );
    setBusy(null);
    if (response.ok && response.data) {
      setBids(response.data);
      setTone("success");
      setStatus("Your bids are up to date.");
    } else {
      if (response.status === 401 || response.status === 403) {
        removeSession("taskarmy");
        setActiveRole(null);
        setWorkerSession(undefined);
        setBids([]);
        setTone("error");
        setStatus("Your session expired. Please log in again.");
        router.push("/login");
        return;
      }
      setTone("error");
      setStatus(response.error ?? "Could not load bids.");
    }
  }, [router, workerSession]);

  useEffect(() => {
    syncSessionState(loadTasks);
    // If no active role, load public tasks
    const sessions = readSessions();
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

  // ✅ AUTO-REFRESH FOR TASKARMY USERS - This ensures newly created tasks appear
  useEffect(() => {
    if (isTaskArmy && workerSession) {
      // Initial load
      loadTasks(workerSession, "taskarmy");

      // Auto-refresh every 15 seconds for TaskArmy users
      const intervalId = setInterval(() => {
        loadTasks(workerSession, "taskarmy");
      }, 15000); // Refresh every 15 seconds

      return () => clearInterval(intervalId);
    }
  }, [isTaskArmy, workerSession, loadTasks]);

  function handleLogout() {
    if (activeRole) removeSession(activeRole);
    setActiveRole(null);
    setTaskerSession(undefined);
    setWorkerSession(undefined);
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
        checklist: getSampleChecklist(category),
        liveTask: task,
      };
    });
  }, [liveTasks, nowTick]);

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
      setUploadProgress({ ...progress });
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
      setUploadProgress({ ...progress });
    }
    setTimeout(() => setUploadProgress({}), 3000);
  }

  // ✅ UPDATED createTask - Now properly updates for both roles
  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskerSession) {
      setTone("error");
      setStatus("Login as Tasker to create a real task.");
      return;
    }
    setBusy("create");
    const response = await taskArmyApi.createTask(
      readBaseUrl(),
      taskerSession.token,
      {
        title: newTaskTitle,
        description: newTaskDescription,
        budget: Number(newTaskBudget),
        deadline: new Date(newTaskDeadline).toISOString(),
      },
    );
    if (response.ok && response.data) {
      const createdTask = response.data as Task;

      if (newTaskFiles.length > 0) {
        setTone("neutral");
        setStatus(
          `Task #${createdTask.id} created. Uploading ${newTaskFiles.length} file(s)...`,
        );
        await uploadFilesForTask(
          createdTask.id,
          taskerSession.token,
          newTaskFiles,
        );
      }

      // Add new task to the top of the feed for Tasker view
      setLiveTasks((current) => [
        createdTask,
        ...current.filter((task) => task.id !== createdTask.id),
      ]);

      // ✅ CRITICAL FIX: If TaskArmy is also logged in, refresh their view
      if (workerSession) {
        // Refresh TaskArmy's browse tasks to include the newly created task
        const browseResponse = await taskArmyApi.browseTasks(
          readBaseUrl(),
          workerSession.token,
        );
        if (browseResponse.ok && browseResponse.data) {
          setLiveTasks(browseResponse.data);
        }
      }

      // Reset all form fields
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskBudget("500");
      setNewTaskDeadline("");
      setNewTaskFiles([]);
      setNewTaskCategory("Content Writing");
      setNewTaskLocation("Remote");

      // Show "All" so the new task is visible, collapse form so user sees the feed
      setActiveCategory("All");
      setShowCreateTask(false);

      setNotificationCount((count) => count + 1);
      setTone("success");
      setStatus(
        newTaskFiles.length > 0
          ? `Task #${createdTask.id} created with ${newTaskFiles.length} file(s) attached.`
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
    if (!workerSession) {
      setTone("error");
      setStatus("Login as TaskArmy to place a real bid.");
      return;
    }
    setBusy("place");
    const response = await taskArmyApi.placeBid(
      readBaseUrl(),
      workerSession.token,
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
    if (!taskerSession) {
      setTone("error");
      setStatus("Login as Tasker to review real bids.");
      return;
    }
    setBusy(action);
    const request =
      action === "accept"
        ? taskArmyApi.acceptBid(
            readBaseUrl(),
            taskerSession.token,
            reviewTask.id,
            selectedBidId,
          )
        : taskArmyApi.rejectBid(
            readBaseUrl(),
            taskerSession.token,
            reviewTask.id,
            selectedBidId,
          );
    const response = await request;
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
    if (!taskerSession) {
      setTone("error");
      setStatus("Login as Tasker to update a real task.");
      return;
    }
    setBusy(`phase-${task.id}`);
    const response = await taskArmyApi.updateTask(
      readBaseUrl(),
      taskerSession.token,
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

  const roleLabel = isTasker ? "Tasker" : isTaskArmy ? "TaskArmy" : null;
  const activeSession = isTasker
    ? taskerSession
    : isTaskArmy
      ? workerSession
      : undefined;
  const activeProfileName = activeSession?.fullName || activeSession?.email;
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
              router.push("/");
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
                {!isTasker && !isTaskArmy && (
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
                {isTasker && showCreateTask && (
                  <section className="px-4 pt-4">
                    <CreateTaskForm
                      title={newTaskTitle}
                      category={newTaskCategory}
                      location={newTaskLocation}
                      budget={newTaskBudget}
                      deadline={newTaskDeadline}
                      description={newTaskDescription}
                      files={newTaskFiles}
                      uploadProgress={uploadProgress}
                      busy={busy === "create"}
                      onTitleChange={setNewTaskTitle}
                      onCategoryChange={setNewTaskCategory}
                      onLocationChange={setNewTaskLocation}
                      onBudgetChange={setNewTaskBudget}
                      onDeadlineChange={setNewTaskDeadline}
                      onDescriptionChange={setNewTaskDescription}
                      onFilesChange={setNewTaskFiles}
                      onSubmit={createTask}
                    />
                  </section>
                )}

                {/* Create task button */}
                {isTasker && (
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

                {/* Info message for TaskArmy */}
                {isTaskArmy && (
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
                        canPlaceBid={isTaskArmy}
                        canViewBids={isTasker}
                        canComplete={isTasker}
                        showBidLoginPrompt={!isTasker && !isTaskArmy}
                        busy={busy === `phase-${task.id}`}
                      />
                    ))
                  )}
                </section>
              </main>

              {/* Bottom navigation */}
              <BottomNav
                isTasker={isTasker}
                isTaskArmy={isTaskArmy}
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
                onMyBids={() => void refreshMyBids()}
                onMessages={() => setStatus("No unread messages.")}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedTask && isTaskArmy && (
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

      {reviewTask && isTasker && (
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
