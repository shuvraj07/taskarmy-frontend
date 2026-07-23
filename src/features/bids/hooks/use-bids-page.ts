"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readActiveRole, removeSession } from "@/lib/session-store";
import type { FeedTask } from "../components";
import { useBidsSession } from "./use-bids-session";
import { useBidsFeed } from "./use-bids-feed";
import { useBidsActions } from "./use-bids-actions";
import { useTaskForm } from "./use-task-form";

export function useBidsPage() {
  const router = useRouter();

  const session = useBidsSession();
  const {
    clientSession,
    setClientSession,
    taskerSession,
    setTaskerSession,
    activeRole,
    setActiveRole,
    isClient,
    isTasker,
    roleLabel,
    activeSession,
    syncSessionState,
  } = session;

  // ── Status/tone/busy — shared across feed loads and actions ────────────────
  const [status, setStatus] = useState(
    "Browse digital tasks, view bids, and place an offer.",
  );
  const [tone, setTone] = useState<"neutral" | "success" | "error">("neutral");
  const [busy, setBusy] = useState<string | null>(null);

  const feed = useBidsFeed({
    taskerSession,
    isTasker,
    setActiveRole,
    setClientSession,
    setTaskerSession,
    setStatus,
    setTone,
    setBusy,
  });
  const {
    bids,
    visibleTasks,
    activeCategory,
    setActiveCategory,
    searchTerm,
    setSearchTerm,
    sortMode,
    setSortMode,
    showFilters,
    setShowFilters,
    getTaskBids,
    loadPublicTasks,
    loadTasks,
    refreshMyBids,
    setLiveTasks,
    setBids,
    setCustomChecklistByTaskId,
  } = feed;

  // ── Bid modal ─────────────────────────────────────────────────────────────
  const [selectedTask, setSelectedTask] = useState<FeedTask | null>(null);
  const [bidAmount, setBidAmount] = useState("500");
  const [bidMessage, setBidMessage] = useState(
    "I can complete this on time and share updates.",
  );

  // ── Review modal ──────────────────────────────────────────────────────────
  const [reviewTask, setReviewTask] = useState<FeedTask | null>(null);
  const [selectedBidId, setSelectedBidId] = useState<number | null>(null);

  // ── Other modals ──────────────────────────────────────────────────────────
  const [checklistTask, setChecklistTask] = useState<FeedTask | null>(null);
  const [posterProfileTask, setPosterProfileTask] = useState<FeedTask | null>(
    null,
  );

  // ── UI ────────────────────────────────────────────────────────────────────
  const [notificationCount, setNotificationCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);

  const form = useTaskForm({
    title: "Write 5 product descriptions",
    location: "Remote",
    budget: "500",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    description:
      "Need someone to write clear, engaging product descriptions for an e-commerce store.",
  });

  const actions = useBidsActions({
    clientSession,
    taskerSession,
    selectedTask,
    bidAmount,
    bidMessage,
    reviewTask,
    selectedBidId,
    form,
    getTaskBids,
    setLiveTasks,
    setCustomChecklistByTaskId,
    refreshMyBids,
    setSelectedTask,
    setBidAmount,
    setBidMessage,
    setActiveCategory,
    setShowCreateTask,
    setNotificationCount,
    setReviewTask,
    setStatus,
    setTone,
    setBusy,
  });
  const { createTask, placeBid, updateBidReview, updateTaskPhase, openBidSheet } =
    actions;

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    syncSessionState(loadTasks);
    const nextActiveRole = readActiveRole();
    if (!nextActiveRole) loadPublicTasks();
    const handleSync = () => syncSessionState(loadTasks);
    window.addEventListener("focus", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [syncSessionState, loadTasks, loadPublicTasks]);

  const reviewBids = reviewTask ? getTaskBids(reviewTask) : [];

  function handleLogout() {
    if (activeRole) removeSession(activeRole);
    setActiveRole(null);
    setClientSession(undefined);
    setTaskerSession(undefined);
    setBids([]);
    setLiveTasks([]);
    router.push("/login");
  }

  return {
    // session
    clientSession,
    taskerSession,
    activeRole,
    isClient,
    isTasker,
    roleLabel,
    activeSession,
    // data
    visibleTasks,
    bids,
    // filters
    activeCategory,
    setActiveCategory,
    searchTerm,
    setSearchTerm,
    sortMode,
    setSortMode,
    showFilters,
    setShowFilters,
    // bid modal
    selectedTask,
    setSelectedTask,
    bidAmount,
    setBidAmount,
    bidMessage,
    setBidMessage,
    // review modal
    reviewTask,
    setReviewTask,
    selectedBidId,
    setSelectedBidId,
    reviewBids,
    // other modals
    checklistTask,
    setChecklistTask,
    posterProfileTask,
    setPosterProfileTask,
    // ui
    notificationCount,
    setNotificationCount,
    showMenu,
    setShowMenu,
    showCreateTask,
    setShowCreateTask,
    status,
    setStatus,
    tone,
    busy,
    // form
    form,
    // actions
    handleLogout,
    openBidSheet,
    createTask,
    placeBid,
    updateBidReview,
    updateTaskPhase,
    getTaskBids,
  };
}
