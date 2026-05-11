"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Box,
  Check,
  CheckCircle2,
  ClipboardList,
  Gavel,
  Home,
  MapPin,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Send,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Star,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { taskArmyApi } from "@/lib/api";
import { readBaseUrl, readSessions } from "@/lib/session-store";
import type { Bid, Session, Task, TaskPhase } from "@/lib/types";

type TaskCategory = "All" | "Delivery" | "Cleaning" | "Repair" | "Installation";

type FeedTask = {
  id: number;
  title: string;
  category: Exclude<TaskCategory, "All">;
  location: string;
  time: string;
  budget: number;
  offers: number;
  distance: number;
  rating: number;
  badge: "FEATURED" | "VERIFIED" | "URGENT";
  imageTone: string;
  icon: typeof Box;
  liveTask?: Task;
};

const categories: Array<{ label: TaskCategory; icon?: typeof Box }> = [
  { label: "All" },
  { label: "Delivery", icon: Box },
  { label: "Cleaning", icon: Sparkles },
  { label: "Repair", icon: Wrench },
  { label: "Installation", icon: Zap },
];

const demoTasks: FeedTask[] = [
  {
    id: 1,
    title: "Deliver Documents to Andheri East",
    category: "Delivery",
    location: "Andheri East, Mumbai",
    time: "Today, 2:00 PM",
    budget: 500,
    offers: 5,
    distance: 4.2,
    rating: 4.8,
    badge: "FEATURED",
    imageTone: "from-violet-500 via-indigo-500 to-sky-300",
    icon: Box,
  },
  {
    id: 2,
    title: "Home Cleaning Service",
    category: "Cleaning",
    location: "Goregaon West, Mumbai",
    time: "Tomorrow, 10:00 AM",
    budget: 600,
    offers: 8,
    distance: 5.1,
    rating: 4.7,
    badge: "VERIFIED",
    imageTone: "from-emerald-500 via-teal-400 to-cyan-200",
    icon: Sparkles,
  },
  {
    id: 3,
    title: "Fix Electrical Switch Board",
    category: "Repair",
    location: "Malad East, Mumbai",
    time: "Today, 6:00 PM",
    budget: 350,
    offers: 3,
    distance: 2.8,
    rating: 4.9,
    badge: "URGENT",
    imageTone: "from-rose-500 via-red-500 to-amber-300",
    icon: Wrench,
  },
  {
    id: 4,
    title: "Install Wall Mounted Shelves",
    category: "Installation",
    location: "Powai, Mumbai",
    time: "Sat, 11:30 AM",
    budget: 750,
    offers: 6,
    distance: 6.4,
    rating: 4.6,
    badge: "VERIFIED",
    imageTone: "from-amber-500 via-orange-400 to-lime-200",
    icon: Zap,
  },
];

const demoBids: Bid[] = [
  {
    id: 101,
    task_id: 1,
    amount: 450,
    message: "I can pick up immediately and deliver with proof.",
    status: "pending",
  },
  {
    id: 102,
    task_id: 1,
    amount: 500,
    message: "Available at 1:30 PM with two-wheeler.",
    status: "pending",
  },
  {
    id: 103,
    task_id: 2,
    amount: 580,
    message: "Deep cleaning kit included.",
    status: "shortlisted",
  },
];

export default function BidsPage() {
  const [taskerSession, setTaskerSession] = useState<Session>();
  const [workerSession, setWorkerSession] = useState<Session>();
  const [liveTasks, setLiveTasks] = useState<Task[]>([]);
  const [createdTasks, setCreatedTasks] = useState<FeedTask[]>([]);
  const [bids, setBids] = useState<Bid[]>(demoBids);
  const [activeCategory, setActiveCategory] = useState<TaskCategory>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState<"best" | "nearest" | "budget">(
    "best",
  );
  const [selectedTask, setSelectedTask] = useState<FeedTask | null>(null);
  const [bidAmount, setBidAmount] = useState("500");
  const [bidMessage, setBidMessage] = useState(
    "I can complete this on time and share updates.",
  );
  const [reviewTask, setReviewTask] = useState<FeedTask | null>(null);
  const router = useRouter();
  const isTasker = Boolean(taskerSession);
  const isTaskArmy = Boolean(workerSession);
  const [selectedBidId, setSelectedBidId] = useState<number | null>(101);
  const [notificationCount, setNotificationCount] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState(
    "Pack and deliver documents",
  );
  const [newTaskCategory, setNewTaskCategory] =
    useState<Exclude<TaskCategory, "All">>("Delivery");
  const [newTaskLocation, setNewTaskLocation] = useState(
    "Andheri East, Mumbai",
  );
  const [newTaskBudget, setNewTaskBudget] = useState("500");
  const [newTaskDeadline, setNewTaskDeadline] = useState("2026-05-10T14:00");
  const [newTaskDescription, setNewTaskDescription] = useState(
    "Need someone reliable to finish this task with updates.",
  );
  const [status, setStatus] = useState(
    "Browse nearby tasks, view bids, and place an offer.",
  );
  const [tone, setTone] = useState<"neutral" | "success" | "error">("neutral");
  const [busy, setBusy] = useState<string | null>(null);

  const loadTasks = useCallback(async (session: Session) => {
    setBusy("tasks");
    const response = await taskArmyApi.browseTasks(
      readBaseUrl(),
      session.token,
    );
    setBusy(null);
    if (response.ok && response.data) {
      setLiveTasks(response.data);
      setTone("success");
      setStatus("Live task list updated.");
    } else {
      setTone("error");
      setStatus(
        response.error ??
          "Could not load live tasks. Demo tasks are still available.",
      );
    }
  }, []);

  const refreshMyBids = useCallback(async () => {
    if (!workerSession) {
      setTone("neutral");
      setStatus("Demo bids loaded. Login as TaskArmy to load your real bids.");
      return;
    }

    setBusy("bids");
    const response = await taskArmyApi.myBids(
      readBaseUrl(),
      workerSession.token,
    );
    setBusy(null);
    if (response.ok && response.data) {
      setBids(response.data.length > 0 ? response.data : demoBids);
      setTone("success");
      setStatus("Your bids are up to date.");
    } else {
      setTone("error");
      setStatus(response.error ?? "Could not load bids.");
    }
  }, [workerSession]);

  useEffect(() => {
    const sessions = readSessions();
    setTaskerSession(sessions.tasker);
    setWorkerSession(sessions.taskarmy);
    if (sessions.taskarmy) {
      void loadTasks(sessions.taskarmy);
    }
  }, [loadTasks]);

  const feedTasks = useMemo(() => {
    const mappedLiveTasks = liveTasks.map((task, index): FeedTask => {
      const category = inferCategory(task.title, task.description);
      const Icon =
        categories.find((item) => item.label === category)?.icon ?? Wrench;
      return {
        id: task.id,
        title: task.title,
        category,
        location: task.owner_name ?? task.poster?.full_name ?? "Mumbai",
        time: task.deadline
          ? new Date(task.deadline).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "Open now",
        budget: task.budget,
        offers: task.bids?.length ?? Math.max(1, index + 2),
        distance: Number((2.4 + index * 1.3).toFixed(1)),
        rating: Number((4.9 - index * 0.1).toFixed(1)),
        badge:
          index % 3 === 0
            ? "FEATURED"
            : index % 2 === 0
              ? "URGENT"
              : "VERIFIED",
        imageTone: [
          "from-violet-500 via-indigo-500 to-sky-300",
          "from-emerald-500 via-teal-400 to-cyan-200",
          "from-rose-500 via-red-500 to-amber-300",
        ][index % 3],
        icon: Icon,
        liveTask: task,
      };
    });

    return [
      ...createdTasks,
      ...(mappedLiveTasks.length > 0 ? mappedLiveTasks : demoTasks),
    ];
  }, [createdTasks, liveTasks]);

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
        if (sortMode === "nearest") return left.distance - right.distance;
        if (sortMode === "budget") return right.budget - left.budget;
        return right.rating - left.rating;
      });
  }, [activeCategory, feedTasks, searchTerm, sortMode]);

  function openBidSheet(task: FeedTask) {
    setSelectedTask(task);
    setBidAmount(String(task.budget));
    setBidMessage(`I can handle "${task.title}" at ${task.time}.`);
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const Icon =
      categories.find((category) => category.label === newTaskCategory)?.icon ??
      Box;
    const feedTask: FeedTask = {
      id: Date.now(),
      title: newTaskTitle,
      category: newTaskCategory,
      location: newTaskLocation,
      time: formatTaskTime(newTaskDeadline),
      budget: Number(newTaskBudget),
      offers: 0,
      distance: Number((1.8 + createdTasks.length * 0.7).toFixed(1)),
      rating: 4.8,
      badge: "FEATURED",
      imageTone: categoryTone(newTaskCategory),
      icon: Icon,
    };

    if (!taskerSession) {
      setCreatedTasks((current) => [feedTask, ...current]);
      setActiveCategory("All");
      setNotificationCount((count) => count + 1);
      setTone("success");
      setStatus(
        "Demo task created and added below the categories. Login as Tasker to save it to the API.",
      );
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
    setBusy(null);

    if (response.ok && response.data) {
      setLiveTasks((current) => [
        response.data as Task,
        ...current.filter((task) => task.id !== response.data?.id),
      ]);
      setActiveCategory("All");
      setNotificationCount((count) => count + 1);
      setTone("success");
      setStatus(
        `Task #${response.data.id} created and added to the bids feed.`,
      );
    } else {
      setTone("error");
      setStatus(response.error ?? "Could not create task.");
    }
  }

  async function placeBid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTask) return;

    if (!workerSession) {
      const newBid: Bid = {
        id: Date.now(),
        task_id: selectedTask.id,
        amount: Number(bidAmount),
        message: bidMessage,
        status: "pending",
      };
      setBids((current) => [newBid, ...current]);
      setSelectedBidId(newBid.id);
      setSelectedTask(null);
      setNotificationCount((count) => count + 1);
      setTone("success");
      setStatus("Demo bid placed. Login as TaskArmy to send it to the API.");
      return;
    }

    setBusy("place");
    const response = await taskArmyApi.placeBid(
      readBaseUrl(),
      workerSession.token,
      selectedTask.id,
      {
        amount: Number(bidAmount),
        message: bidMessage,
      },
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
      setBids((current) =>
        current.map((bid) =>
          bid.id === selectedBidId
            ? { ...bid, status: action === "accept" ? "accepted" : "rejected" }
            : bid,
        ),
      );
      setReviewTask(null);
      setTone("success");
      setStatus(
        `Demo bid ${action === "accept" ? "accepted" : "rejected"}. Login as Tasker to update the API.`,
      );
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
      setTone("neutral");
      setStatus(`Demo task marked ${phase.replace("_", " ")}.`);
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

  return (
    <>
      <div className="min-h-screen w-full bg-[#f8f6ff]">
        <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden border-r border-[#ded7ee] bg-white lg:flex lg:flex-col">
            <div className="sticky top-0 flex h-screen flex-col gap-6 overflow-hidden px-5 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4f22bd] text-white">
                  <Shield className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[#21145f]">TaskArmy</p>
                  <p className="text-sm text-[#6d668a]">Bids dashboard</p>
                </div>
              </div>

              <div className="space-y-2">
                <SidebarItem
                  icon={Home}
                  label="Home"
                  active
                  onClick={() => {
                    router.push("/");
                    setStatus("Home feed selected.");
                  }}
                />
                <SidebarItem
                  icon={ClipboardList}
                  label="Tasks"
                  onClick={() =>
                    setStatus(`${visibleTasks.length} tasks visible.`)
                  }
                />
                <SidebarItem
                  icon={Gavel}
                  label="Bids"
                  onClick={() => void refreshMyBids()}
                />
                <SidebarItem
                  icon={MessageCircle}
                  label="Messages"
                  onClick={() => setStatus("No unread messages in demo mode.")}
                />
              </div>

              <div className="mt-auto rounded-[24px] bg-[#f4efff] p-4 text-sm font-semibold text-[#21145f]">
                <p className="text-xs uppercase tracking-[0.24em] text-[#6d668a]">
                  Status
                </p>
                <p className="mt-3 leading-6">{status}</p>
              </div>
            </div>
          </aside>

          <div className="overflow-hidden">
            <div className="min-h-screen w-full overflow-hidden bg-[#f8f6ff]">
              <header className="bg-gradient-to-br from-[#5b35c8] via-[#4c24b7] to-[#371184] px-6 pb-7 pt-6 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white text-[#4b20b5] shadow-lg">
                      <Shield className="h-9 w-9" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold leading-none">
                        TaskArmy
                      </p>
                      <p className="mt-1 text-sm font-medium text-white/85">
                        Get Things Done
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <IconButton
                      label="Notifications"
                      onClick={() => {
                        setNotificationCount(0);
                        setStatus("Notifications cleared.");
                      }}
                    >
                      <Bell className="h-6 w-6" aria-hidden="true" />
                      {notificationCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold">
                          {notificationCount}
                        </span>
                      )}
                    </IconButton>
                    <IconButton
                      label="Search"
                      onClick={() =>
                        document.getElementById("task-search")?.focus()
                      }
                    >
                      <Search className="h-7 w-7" aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      label="Menu"
                      onClick={() => setShowMenu((value) => !value)}
                    >
                      <Menu className="h-7 w-7" aria-hidden="true" />
                    </IconButton>
                  </div>
                </div>
              </header>

              {showMenu && (
                <div className="border-b border-[#ded7ee] bg-white px-6 py-3 text-sm font-semibold text-[#21145f]">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      className="rounded-md bg-[#f4efff] px-3 py-2"
                      onClick={() => void refreshMyBids()}
                    >
                      My bids
                    </button>
                    <button
                      className="rounded-md bg-[#f4efff] px-3 py-2"
                      onClick={() =>
                        workerSession && void loadTasks(workerSession)
                      }
                    >
                      Refresh
                    </button>
                    <button
                      className="rounded-md bg-[#f4efff] px-3 py-2"
                      onClick={() =>
                        setStatus("Messages are ready from the bottom tab.")
                      }
                    >
                      Help
                    </button>
                  </div>
                </div>
              )}

              <main className="pb-24">
                {!isTasker && !isTaskArmy && (
                  <div className="px-4 py-4">
                    <div className="grid gap-4 rounded-lg border border-[#fde1a9] bg-[#fff7e1] p-4 text-sm font-semibold text-[#7a5316]">
                      <p>
                        Please login as Tasker to post tasks and view bids, or
                        as TaskArmy to place bids.
                      </p>
                      <button
                        className="inline-flex items-center justify-center rounded-md bg-[#4f22bd] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#3a1696]"
                        type="button"
                        onClick={() => router.push("/login")}
                      >
                        Login on this page
                      </button>
                    </div>
                  </div>
                )}
                <section className="space-y-4 border-b border-[#ded7ee] bg-white/60 px-4 py-5">
                  <form
                    className="flex overflow-hidden rounded-lg border border-[#ded7ee] bg-white shadow-[0_8px_22px_rgba(41,24,79,0.1)]"
                    onSubmit={(event) => event.preventDefault()}
                  >
                    <input
                      id="task-search"
                      className="min-h-16 min-w-0 flex-1 px-4 text-base font-medium text-[#21145f] outline-none placeholder:text-[#8d86aa]"
                      placeholder="Search tasks, skills, or locations..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
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
                      onClick={() => setShowFilters((value) => !value)}
                    >
                      <SlidersHorizontal
                        className="h-7 w-7"
                        aria-hidden="true"
                      />
                    </button>
                  </form>

                  {showFilters && (
                    <div className="rounded-lg border border-[#ded7ee] bg-white p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#786fa0]">
                        Sort tasks
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {(["best", "nearest", "budget"] as const).map(
                          (mode) => (
                            <button
                              key={mode}
                              className={`rounded-md px-3 py-2 text-sm font-bold capitalize ${sortMode === mode ? "bg-[#4f22bd] text-white" : "bg-[#f4efff] text-[#21145f]"}`}
                              onClick={() => setSortMode(mode)}
                              type="button"
                            >
                              {mode}
                            </button>
                          ),
                        )}
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
                          className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border px-5 text-sm font-bold shadow-sm transition ${
                            active
                              ? "border-[#4f22bd] bg-[#4f22bd] text-white"
                              : "border-[#ded7ee] bg-white text-[#21145f]"
                          }`}
                          type="button"
                          onClick={() => setActiveCategory(category.label)}
                        >
                          {Icon && (
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          )}
                          {category.label}
                        </button>
                      );
                    })}
                  </div>

                  {isTasker ? (
                    <button
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#4f22bd] text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(79,34,189,0.28)]"
                      type="button"
                      onClick={() => setShowCreateTask((value) => !value)}
                    >
                      <Plus className="h-5 w-5" aria-hidden="true" />
                      {showCreateTask ? "Hide Create Task" : "Create Task"}
                    </button>
                  ) : (
                    <div className="rounded-lg border border-[#ded7ee] bg-white p-4 text-sm font-semibold text-[#6d668a]">
                      Login as Tasker to create tasks. TaskArmy users can place
                      bids on available tasks.
                    </div>
                  )}

                  {showCreateTask && isTasker && (
                    <CreateTaskPanel
                      title={newTaskTitle}
                      category={newTaskCategory}
                      location={newTaskLocation}
                      budget={newTaskBudget}
                      deadline={newTaskDeadline}
                      description={newTaskDescription}
                      busy={busy === "create"}
                      onTitleChange={setNewTaskTitle}
                      onCategoryChange={setNewTaskCategory}
                      onLocationChange={setNewTaskLocation}
                      onBudgetChange={setNewTaskBudget}
                      onDeadlineChange={setNewTaskDeadline}
                      onDescriptionChange={setNewTaskDescription}
                      onSubmit={createTask}
                    />
                  )}
                </section>

                <div className="px-4 py-3">
                  <div
                    className={`rounded-md border px-3 py-2 text-sm font-semibold ${tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-[#ded7ee] bg-white text-[#6d668a]"}`}
                  >
                    {busy === "tasks" ? "Loading live tasks..." : status}
                  </div>
                </div>

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
                          setReviewTask(task);
                          setSelectedBidId(
                            (
                              bids.find((bid) => bid.task_id === task.id) ??
                              demoBids[0]
                            )?.id ?? null,
                          );
                        }}
                        canPlaceBid={isTaskArmy}
                        canViewBids={isTasker}
                        canComplete={isTasker}
                        onComplete={() =>
                          void updateTaskPhase(task, "completed")
                        }
                        busy={busy === `phase-${task.id}`}
                      />
                    ))
                  )}
                </section>
              </main>

              <nav className="fixed bottom-0 left-0 z-30 grid w-full grid-cols-5 border-t border-[#ded7ee] bg-white px-3 py-3 text-[#2a1679] shadow-[0_-12px_34px_rgba(41,24,79,0.14)] lg:hidden">
                <BottomTab
                  icon={Home}
                  label="Home"
                  onClick={() => {
                    router.push("/");
                    setStatus("Home feed selected.");
                  }}
                />
                <BottomTab
                  icon={Plus}
                  label="Post"
                  large
                  onClick={() => {
                    setShowCreateTask(true);
                    setStatus("Create task form opened.");
                  }}
                />
                <BottomTab
                  icon={ClipboardList}
                  label="Tasks"
                  active
                  onClick={() =>
                    setStatus(`${visibleTasks.length} tasks visible.`)
                  }
                />
                <BottomTab
                  icon={MessageCircle}
                  label="Messages"
                  onClick={() => setStatus("No unread messages in demo mode.")}
                />
                <BottomTab
                  icon={Gavel}
                  label="Bids"
                  onClick={() => void refreshMyBids()}
                />
              </nav>
            </div>
          </div>
        </div>
      </div>

      {selectedTask && (
        <Dialog title="Place Bid" onClose={() => setSelectedTask(null)}>
          <form className="space-y-4" onSubmit={placeBid}>
            <div>
              <p className="text-lg font-bold text-[#21145f]">
                {selectedTask.title}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#6d668a]">
                Budget Rs {selectedTask.budget} - {selectedTask.location}
              </p>
            </div>
            <label className="block">
              <span className="text-sm font-bold text-[#21145f]">
                Your amount
              </span>
              <input
                className="mt-1 min-h-12 w-full rounded-md border border-[#ded7ee] px-3 text-base font-bold text-[#21145f]"
                type="number"
                min="1"
                value={bidAmount}
                onChange={(event) => setBidAmount(event.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-[#21145f]">Message</span>
              <textarea
                className="mt-1 min-h-24 w-full resize-none rounded-md border border-[#ded7ee] px-3 py-2 text-sm font-semibold text-[#21145f]"
                value={bidMessage}
                onChange={(event) => setBidMessage(event.target.value)}
              />
            </label>
            <button
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#4f22bd] text-base font-bold text-white"
              disabled={busy === "place"}
              type="submit"
            >
              <Send className="h-5 w-5" aria-hidden="true" />
              {busy === "place" ? "Sending..." : "Place Bid"}
            </button>
          </form>
        </Dialog>
      )}

      {reviewTask && (
        <Dialog title="View Bids" onClose={() => setReviewTask(null)}>
          <div className="space-y-3">
            <p className="text-lg font-bold text-[#21145f]">
              {reviewTask.title}
            </p>
            {(bids.filter((bid) => bid.task_id === reviewTask.id).length > 0
              ? bids.filter((bid) => bid.task_id === reviewTask.id)
              : demoBids
            ).map((bid) => (
              <button
                key={bid.id}
                className={`w-full rounded-lg border p-3 text-left ${selectedBidId === bid.id ? "border-[#4f22bd] bg-[#f4efff]" : "border-[#ded7ee] bg-white"}`}
                type="button"
                onClick={() => setSelectedBidId(bid.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-[#21145f]">
                    Bid #{bid.id}
                  </span>
                  <span className="rounded-full bg-[#4f22bd] px-3 py-1 text-sm font-bold text-white">
                    Rs {bid.amount}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#6d668a]">
                  {bid.message ?? "No message added."}
                </p>
                <p className="mt-2 text-xs font-bold uppercase text-[#8d86aa]">
                  {bid.status ?? "pending"}
                </p>
              </button>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                className="min-h-12 rounded-md border border-[#ded7ee] bg-white font-bold text-[#21145f]"
                onClick={() => void updateBidReview("reject")}
                disabled={busy === "reject"}
                type="button"
              >
                Reject
              </button>
              <button
                className="min-h-12 rounded-md bg-[#4f22bd] font-bold text-white"
                onClick={() => void updateBidReview("accept")}
                disabled={busy === "accept"}
                type="button"
              >
                Accept
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}

function inferCategory(
  title: string,
  description = "",
): Exclude<TaskCategory, "All"> {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes("clean")) return "Cleaning";
  if (text.includes("deliver") || text.includes("courier")) return "Delivery";
  if (text.includes("install") || text.includes("mount")) return "Installation";
  return "Repair";
}

function categoryTone(category: Exclude<TaskCategory, "All">) {
  const tones: Record<Exclude<TaskCategory, "All">, string> = {
    Delivery: "from-violet-500 via-indigo-500 to-sky-300",
    Cleaning: "from-emerald-500 via-teal-400 to-cyan-200",
    Repair: "from-rose-500 via-red-500 to-amber-300",
    Installation: "from-amber-500 via-orange-400 to-lime-200",
  };

  return tones[category];
}

function formatTaskTime(value: string) {
  if (!value) return "Open now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Open now";
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function CreateTaskPanel({
  title,
  category,
  location,
  budget,
  deadline,
  description,
  busy,
  onTitleChange,
  onCategoryChange,
  onLocationChange,
  onBudgetChange,
  onDeadlineChange,
  onDescriptionChange,
  onSubmit,
}: {
  title: string;
  category: Exclude<TaskCategory, "All">;
  location: string;
  budget: string;
  deadline: string;
  description: string;
  busy: boolean;
  onTitleChange: (value: string) => void;
  onCategoryChange: (value: Exclude<TaskCategory, "All">) => void;
  onLocationChange: (value: string) => void;
  onBudgetChange: (value: string) => void;
  onDeadlineChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      className="rounded-lg border border-[#ded7ee] bg-white p-4 shadow-[0_8px_22px_rgba(41,24,79,0.1)]"
      onSubmit={onSubmit}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#786fa0]">
            Create task
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
            onChange={(event) => onTitleChange(event.target.value)}
            required
          />
        </FormField>

        <FormField label="Category">
          <select
            className="mt-1 min-h-11 w-full rounded-md border border-[#ded7ee] bg-[#fbfaff] px-3 text-sm font-semibold text-[#21145f] outline-none focus:border-[#4f22bd]"
            value={category}
            onChange={(event) =>
              onCategoryChange(
                event.target.value as Exclude<TaskCategory, "All">,
              )
            }
          >
            {categories
              .filter(
                (
                  item,
                ): item is {
                  label: Exclude<TaskCategory, "All">;
                  icon?: typeof Box;
                } => item.label !== "All",
              )
              .map((item) => (
                <option key={item.label} value={item.label}>
                  {item.label}
                </option>
              ))}
          </select>
        </FormField>

        <FormField label="Location">
          <input
            className="mt-1 min-h-11 w-full rounded-md border border-[#ded7ee] bg-[#fbfaff] px-3 text-sm font-semibold text-[#21145f] outline-none focus:border-[#4f22bd]"
            value={location}
            onChange={(event) => onLocationChange(event.target.value)}
            required
          />
        </FormField>

        <FormField label="Budget">
          <input
            className="mt-1 min-h-11 w-full rounded-md border border-[#ded7ee] bg-[#fbfaff] px-3 text-sm font-semibold text-[#21145f] outline-none focus:border-[#4f22bd]"
            min="1"
            type="number"
            value={budget}
            onChange={(event) => onBudgetChange(event.target.value)}
            required
          />
        </FormField>

        <FormField label="Deadline">
          <input
            className="mt-1 min-h-11 w-full rounded-md border border-[#ded7ee] bg-[#fbfaff] px-3 text-sm font-semibold text-[#21145f] outline-none focus:border-[#4f22bd]"
            type="datetime-local"
            value={deadline}
            onChange={(event) => onDeadlineChange(event.target.value)}
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
            onChange={(event) => onDescriptionChange(event.target.value)}
          />
        </label>
      </div>

      <button
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#4f22bd] text-sm font-extrabold text-white disabled:opacity-60"
        disabled={busy}
        type="submit"
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
        {busy ? "Creating..." : "Create Task"}
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

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="relative flex h-14 w-14 items-center justify-center rounded-lg bg-white/10 text-white shadow-[0_8px_24px_rgba(20,9,63,0.22)] transition hover:bg-white/15"
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function TaskBidCard({
  task,
  bidCount,
  onPlaceBid,
  onViewBids,
  onComplete,
  canPlaceBid,
  canViewBids,
  canComplete,
  busy,
}: {
  task: FeedTask;
  bidCount: number;
  onPlaceBid: () => void;
  onViewBids: () => void;
  onComplete: () => void;
  canPlaceBid: boolean;
  canViewBids: boolean;
  canComplete: boolean;
  busy: boolean;
}) {
  const BadgeIcon =
    task.badge === "FEATURED"
      ? Star
      : task.badge === "VERIFIED"
        ? CheckCircle2
        : Shield;
  const TaskIcon = task.icon;

  return (
    <article className="rounded-lg border border-[#ded7ee] bg-white p-3 shadow-[0_8px_24px_rgba(41,24,79,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div
            className={`relative flex h-[86px] w-[86px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br ${task.imageTone}`}
          >
            <div className="absolute inset-x-0 bottom-0 h-8 bg-black/15" />
            <TaskIcon
              className="relative h-11 w-11 text-white drop-shadow"
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0">
            {task.badge === "FEATURED" && (
              <span className="mb-2 inline-flex rounded-md bg-[#8653e6] px-3 py-1 text-xs font-bold text-white">
                FEATURED
              </span>
            )}
            <h2 className="text-lg font-extrabold leading-tight text-[#21145f]">
              {task.title}
            </h2>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#21145f]">
              <MapPin
                className="h-4 w-4 shrink-0 text-[#7448db]"
                aria-hidden="true"
              />
              <span className="truncate">
                {task.location} - {task.time}
              </span>
            </p>
            <p className="mt-2 text-sm font-bold text-[#21145f]">
              Budget Rs {task.budget}{" "}
              <span className="mx-2 text-[#ded7ee]">|</span> {bidCount} Offers
            </p>
          </div>
        </div>
        <div
          className={`hidden h-16 w-16 shrink-0 items-center justify-center rounded-full sm:flex ${task.badge === "URGENT" ? "bg-red-50 text-red-600" : task.badge === "VERIFIED" ? "bg-violet-50 text-violet-700" : "bg-amber-50 text-amber-500"}`}
        >
          <BadgeIcon className="h-10 w-10" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 border-t border-[#ded7ee] pt-3 text-[#21145f]">
        <Metric label="Budget" value={`Rs ${task.budget}`} />
        <Metric label="Bids" value={`${bidCount} offers`} />
        <Metric label="Distance" value={`${task.distance} km`} />
        <Metric label="Client Rating" value={`Star ${task.rating}`} highlight />
      </div>

      <div
        className={`mt-4 grid gap-2 ${canComplete ? "grid-cols-[1fr_1fr_auto]" : "grid-cols-2"}`}
      >
        <button
          className="min-h-11 rounded-md border border-[#ded7ee] bg-white text-sm font-extrabold text-[#371184] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={onViewBids}
          disabled={!canViewBids}
        >
          {canViewBids ? "View Bids" : "Login as Tasker to view bids"}
        </button>
        <button
          className="min-h-11 rounded-md bg-[#4f22bd] text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={onPlaceBid}
          disabled={!canPlaceBid}
        >
          {canPlaceBid ? "Place Bid" : "Login as TaskArmy to bid"}
        </button>
        {canComplete && (
          <button
            className="flex h-11 w-11 items-center justify-center rounded-md border border-[#ded7ee] bg-white text-[#371184]"
            type="button"
            title="Mark complete"
            aria-label="Mark complete"
            onClick={onComplete}
            disabled={busy}
          >
            <Check className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0 border-r border-[#ded7ee] last:border-r-0">
      <p className="truncate text-xs font-semibold">{label}</p>
      <p
        className={`mt-1 truncate text-sm font-extrabold ${highlight ? "text-[#21145f]" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function BottomTab({
  icon: Icon,
  label,
  active = false,
  large = false,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  active?: boolean;
  large?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex flex-col items-center justify-center gap-1 text-xs font-extrabold ${active ? "text-[#4f22bd]" : "text-[#2a1679]"}`}
      type="button"
      onClick={onClick}
    >
      <span
        className={`flex items-center justify-center ${large ? "h-14 w-14 rounded-full bg-[#4f22bd] text-white" : "h-8 w-8"}`}
      >
        <Icon className={large ? "h-8 w-8" : "h-7 w-7"} aria-hidden="true" />
      </span>
      {label}
    </button>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${active ? "bg-[#4f22bd] text-white" : "bg-[#f4efff] text-[#21145f] hover:bg-[#ede8ff]"}`}
      type="button"
      onClick={onClick}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#4f22bd]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      {label}
    </button>
  );
}

function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-4 pb-4 sm:items-center sm:pb-0">
      <section className="w-full max-w-[480px] rounded-lg bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-[#21145f]">{title}</h2>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-md bg-[#f4efff] text-[#21145f]"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
