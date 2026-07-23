"use client";

import { Dispatch, FormEvent, SetStateAction } from "react";
import { bidsApi } from "../api/bids";
import { tasksApi } from "@/lib/api/tasks";
import { useWalletStore } from "@/lib/payment/wallet-store";
import { readBaseUrl } from "@/lib/session-store";
import type { Bid, Session, Task, TaskPhase } from "@/lib/types";
import type { ChecklistItem, FeedTask, TaskCategory } from "../components";
import type { useTaskForm } from "./use-task-form";

export function useBidsActions(args: {
  clientSession: Session | undefined;
  taskerSession: Session | undefined;
  selectedTask: FeedTask | null;
  bidAmount: string;
  bidMessage: string;
  reviewTask: FeedTask | null;
  selectedBidId: number | null;
  form: ReturnType<typeof useTaskForm>;
  getTaskBids: (task: FeedTask) => Bid[];
  setLiveTasks: Dispatch<SetStateAction<Task[]>>;
  setCustomChecklistByTaskId: Dispatch<
    SetStateAction<Record<number, ChecklistItem[]>>
  >;
  refreshMyBids: () => Promise<void>;
  setSelectedTask: (task: FeedTask | null) => void;
  setBidAmount: (amount: string) => void;
  setBidMessage: (message: string) => void;
  setActiveCategory: (category: TaskCategory) => void;
  setShowCreateTask: (show: boolean) => void;
  setNotificationCount: Dispatch<SetStateAction<number>>;
  setReviewTask: (task: FeedTask | null) => void;
  setStatus: (status: string) => void;
  setTone: (tone: "neutral" | "success" | "error") => void;
  setBusy: (busy: string | null) => void;
}) {
  const {
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
  } = args;

  function openBidSheet(task: FeedTask) {
    setSelectedTask(task);
    setBidAmount(String(task.budget));
    setBidMessage(`I can handle "${task.title}" ${task.time}.`);
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

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientSession) {
      setTone("error");
      setStatus("Login as Client to create a real task.");
      return;
    }
    setBusy("create");
    const response = await tasksApi.createTask(readBaseUrl(), clientSession.token, {
      title: form.title,
      description: form.description,
      budget: Number(form.budget),
      deadline: new Date(form.deadline).toISOString(),
    });
    if (response.ok && response.data) {
      const createdTask = response.data as Task;
      const fileCount = form.files.length;

      setCustomChecklistByTaskId((current) => ({
        ...current,
        [createdTask.id]: form.checklist,
      }));

      if (fileCount > 0) {
        setTone("neutral");
        setStatus(`Task #${createdTask.id} created. Uploading ${fileCount} file(s)...`);
        await uploadFilesForTask(createdTask.id, clientSession.token, form.files);
      }

      setLiveTasks((current) => [
        createdTask,
        ...current.filter((t) => t.id !== createdTask.id),
      ]);

      if (taskerSession) {
        const browseResponse = await tasksApi.browseTasks(
          readBaseUrl(),
          taskerSession.token,
        );
        if (browseResponse.ok && browseResponse.data) {
          setLiveTasks(browseResponse.data);
        }
      }

      form.reset();
      setActiveCategory("All");
      setShowCreateTask(false);
      setNotificationCount((n) => n + 1);
      setTone("success");
      setStatus(
        fileCount > 0
          ? `Task #${createdTask.id} created with ${fileCount} file(s) attached.`
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
    if (!selectedTask || !taskerSession) {
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
      setNotificationCount((n) => n + 1);
      await refreshMyBids();
    } else {
      setTone("error");
      setStatus(response.error ?? "Could not place bid.");
    }
  }

  async function updateBidReview(action: "accept" | "reject") {
    if (!reviewTask || selectedBidId === null || !clientSession) {
      setTone("error");
      setStatus("Login as Client to review real bids.");
      return;
    }
    setBusy(action);
    const response = await bidsApi[
      action === "accept" ? "acceptBid" : "rejectBid"
    ](readBaseUrl(), clientSession.token, reviewTask.id, selectedBidId);
    setBusy(null);
    setTone(response.ok ? "success" : "error");
    setStatus(
      response.ok
        ? `Bid ${action === "accept" ? "accepted" : "rejected"}.`
        : (response.error ?? `Could not ${action} bid.`),
    );
    if (response.ok) {
      if (action === "accept") {
        const acceptedBid = getTaskBids(reviewTask).find(
          (bid) => bid.id === selectedBidId,
        );
        useWalletStore.getState().fundEscrow(
          reviewTask.id,
          acceptedBid?.amount ?? reviewTask.budget,
          { name: acceptedBid?.bidder_name, email: acceptedBid?.bidder_email },
        );
      }
      setReviewTask(null);
    }
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
    if (response.ok && phase === "completed") {
      useWalletStore.getState().releaseEscrow(task.id);
    }
    if (response.ok && phase === "cancelled") {
      useWalletStore.getState().refundEscrow(task.id);
    }
  }

  return {
    openBidSheet,
    createTask,
    placeBid,
    updateBidReview,
    updateTaskPhase,
  };
}
