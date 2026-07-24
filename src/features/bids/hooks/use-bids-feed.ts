"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  inferCategory,
  getTaskImageUrl,
  getSampleChecklist,
  type FeedTask,
  type TaskCategory,
  type ChecklistItem,
} from "../components";
import { formatRelativeTime, formatTimeRemaining } from "@/lib/format";
import { tasksApi } from "@/lib/api/tasks";
import { bidsApi } from "../api/bids";
import { request } from "@/lib/api/client";
import { readBaseUrl, removeSession } from "@/lib/session-store";
import type { Bid, Role, Session, Task } from "@/lib/types";

export function useBidsFeed(args: {
  taskerSession: Session | undefined;
  isTasker: boolean;
  setActiveRole: (role: Role | null) => void;
  setClientSession: (session: Session | undefined) => void;
  setTaskerSession: (session: Session | undefined) => void;
  setStatus: (status: string) => void;
  setTone: (tone: "neutral" | "success" | "error") => void;
  setBusy: (busy: string | null) => void;
}) {
  const {
    taskerSession,
    isTasker,
    setActiveRole,
    setClientSession,
    setTaskerSession,
    setStatus,
    setTone,
    setBusy,
  } = args;
  const router = useRouter();

  // ── Data ──────────────────────────────────────────────────────────────────
  const [liveTasks, setLiveTasks] = useState<Task[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [customChecklistByTaskId, setCustomChecklistByTaskId] = useState<
    Record<number, ChecklistItem[]>
  >({});

  // ── Filters ───────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<TaskCategory>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState<"best" | "budget">("best");
  const [showFilters, setShowFilters] = useState(false);

  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const loadPublicTasks = useCallback(async () => {
    setBusy("tasks");
    const response = await request<Task[]>(readBaseUrl(), "/tasks/browse", "GET");
    setBusy(null);
    if (response.ok && response.data) {
      setLiveTasks(Array.isArray(response.data) ? response.data : []);
      setTone("success");
      setStatus("Browse available tasks below.");
    } else {
      setTone("error");
      setStatus("Could not load tasks right now. Please try again later.");
      setLiveTasks([]);
    }
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
    const response = await bidsApi.myBids(readBaseUrl(), taskerSession.token);
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

  // Auto-refresh for tasker — initial load is handled by the session-sync effect
  useEffect(() => {
    if (!isTasker || !taskerSession) return;
    const id = setInterval(() => loadTasks(taskerSession, "tasker"), 15_000);
    return () => clearInterval(id);
  }, [isTasker, taskerSession, loadTasks]);

  // ── Computed feed ─────────────────────────────────────────────────────────
  const feedTasks = useMemo(
    () =>
      liveTasks.map((task): FeedTask => {
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
        return {
          id: task.id,
          title: task.title,
          description: task.description ?? "No description added yet.",
          category,
          location: "Remote",
          posterName,
          time: task.deadline
            ? formatTimeRemaining(task.deadline, nowTick)
            : "Open now",
          postedAgo: formatRelativeTime(task.created_at, nowTick),
          budget: task.budget,
          offers: task.bids?.length ?? 1,
          imageUrl: getTaskImageUrl(task),
          checklist:
            customChecklistByTaskId[task.id] ?? getSampleChecklist(category),
          liveTask: task,
        };
      }),
    [liveTasks, nowTick, customChecklistByTaskId],
  );

  const visibleTasks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return feedTasks
      .filter(
        (t) => activeCategory === "All" || t.category === activeCategory,
      )
      .filter(
        (t) =>
          !query ||
          `${t.title} ${t.category} ${t.location}`
            .toLowerCase()
            .includes(query),
      )
      .sort((a, b) => (sortMode === "budget" ? b.budget - a.budget : 0));
  }, [activeCategory, feedTasks, searchTerm, sortMode]);

  const getTaskBids = useCallback(
    (task: FeedTask) =>
      task.liveTask?.bids?.length
        ? task.liveTask.bids
        : bids.filter((bid) => bid.task_id === task.id),
    [bids],
  );

  return {
    liveTasks,
    setLiveTasks,
    bids,
    setBids,
    customChecklistByTaskId,
    setCustomChecklistByTaskId,
    activeCategory,
    setActiveCategory,
    searchTerm,
    setSearchTerm,
    sortMode,
    setSortMode,
    showFilters,
    setShowFilters,
    visibleTasks,
    getTaskBids,
    loadPublicTasks,
    loadTasks,
    refreshMyBids,
  };
}
