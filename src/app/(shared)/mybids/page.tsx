"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock,
  FolderOpen,
  Gavel,
  Home,
  LogOut,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Shield,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { bidsApi } from "@/lib/api/bids";
import {
  readActiveRole,
  readBaseUrl,
  readSessions,
  removeSession,
} from "@/lib/session-store";
import type { Bid, Role, Session } from "@/lib/types";

const PROFILE_PHOTO_URL = "https://randomuser.me/api/portraits/men/32.jpg";

type BidStatus = "accepted" | "pending" | "rejected";
type TaskStatus =
  | "open"
  | "in_progress"
  | "submitted"
  | "revision_requested"
  | "completed"
  | "disputed"
  | "cancelled";

interface BidWithTaskStatus extends Bid {
  task_status?: TaskStatus;
  revision_note?: string;
}

export default function MyBidsPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | undefined>();
  const [bids, setBids] = useState<BidWithTaskStatus[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [status, setStatus] = useState<{
    message: string;
    tone: "neutral" | "success" | "error";
  }>({ message: "Loading your bids…", tone: "neutral" });
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const activeRole = readActiveRole();
    if (activeRole !== "tasker") {
      router.replace("/login");
      return;
    }
    const sessions = readSessions();
    if (!sessions.tasker) {
      router.replace("/login");
      return;
    }
    setSession(sessions.tasker);
  }, [router]);

  const fetchBids = useCallback(
    async (sess: Session, silent = false) => {
      if (!silent) setBusy(true);
      const response = await bidsApi.myBids(readBaseUrl(), sess.token);
      if (!silent) setBusy(false);

      if (response.ok && response.data) {
        const next = response.data as BidWithTaskStatus[];

        const enriched = await Promise.all(
          next.map(async (bid) => {
            if (bid.status === "accepted" && bid.task_id) {
              try {
                const taskRes = await fetch(
                  `${readBaseUrl()}/tasks/${bid.task_id}`,
                  { headers: { Authorization: `Bearer ${sess.token}` } },
                );
                if (taskRes.ok) {
                  const task = await taskRes.json();
                  return {
                    ...bid,
                    task_status: task.status as TaskStatus,
                    revision_note: task.revision_note ?? null,
                  };
                }
              } catch {}
            }
            return bid;
          }),
        );

        setBids((prev) => {
          const newlyAccepted = enriched.filter(
            (b) =>
              b.status === "accepted" &&
              !prev.find((p) => p.id === b.id && p.status === "accepted"),
          );
          if (newlyAccepted.length > 0) {
            setNotificationCount((c) => c + newlyAccepted.length);
            setStatus({
              message: `🎉 ${newlyAccepted.length} new offer${newlyAccepted.length > 1 ? "s" : ""} accepted!`,
              tone: "success",
            });
          } else {
            const accepted = enriched.filter(
              (b) => b.status === "accepted",
            ).length;
            setStatus({
              message:
                accepted > 0
                  ? `${accepted} bid${accepted > 1 ? "s" : ""} accepted.`
                  : `${enriched.length} bid${enriched.length !== 1 ? "s" : ""} loaded.`,
              tone: accepted > 0 ? "success" : "neutral",
            });
          }
          return enriched;
        });

        setLastUpdated(new Date());
      } else {
        if (response.status === 401 || response.status === 403) {
          removeSession("tasker");
          setSession(undefined);
          setBids([]);
          setStatus({
            message: "Your session expired. Please log in again.",
            tone: "error",
          });
          router.replace("/login");
          return;
        }
        setStatus({
          message: response.error ?? "Could not load bids.",
          tone: "error",
        });
      }
    },
    [router],
  );

  useEffect(() => {
    if (!session) return;
    void fetchBids(session);
    const id = window.setInterval(() => void fetchBids(session, true), 30_000);
    return () => window.clearInterval(id);
  }, [session, fetchBids]);

  function handleLogout() {
    removeSession("tasker" as Role);
    router.push("/login");
  }

  const accepted = bids.filter((b) => b.status === "accepted");
  const pending = bids.filter((b) => !b.status || b.status === "pending");
  const rejected = bids.filter((b) => b.status === "rejected");
  const profileName = session?.fullName || session?.email;

  return (
    <div className="min-h-screen w-full bg-[#f8f6ff]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-br from-[#5b35c8] via-[#4c24b7] to-[#371184] px-3 pb-4 pt-4 text-white shadow-[0_4px_24px_rgba(41,24,79,0.25)] sm:px-4 sm:pb-5 sm:pt-5">
        {/* Top row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25 sm:h-11 sm:w-11"
              type="button"
              aria-label="Go back"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className="text-lg font-extrabold leading-none tracking-tight sm:text-xl">
                My Bids
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-white/70 sm:text-xs">
                {bids.length} total · {accepted.length} accepted
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {lastUpdated && (
              <span className="hidden rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white/80 md:inline">
                Updated{" "}
                {lastUpdated.toLocaleTimeString([], { timeStyle: "short" })}
              </span>
            )}
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25 sm:h-11 sm:w-11"
              type="button"
              aria-label="Notifications"
              onClick={() => setNotificationCount(0)}
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold sm:h-5 sm:w-5 sm:text-[10px]">
                  {notificationCount}
                </span>
              )}
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25 disabled:opacity-50 sm:h-11 sm:w-11"
              type="button"
              aria-label="Refresh bids"
              disabled={busy}
              onClick={() => session && void fetchBids(session)}
            >
              <RefreshCw
                className={`h-4 w-4 sm:h-5 sm:w-5 ${busy ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Profile strip */}
        {session && (
          <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2">
            <Image
              src={session.avatarUrl ?? PROFILE_PHOTO_URL}
              alt={profileName ? `${profileName} profile` : "Profile"}
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-full border border-white/30 object-cover"
              unoptimized
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white leading-tight">
                {profileName}
              </p>
              <p className="text-[11px] font-semibold text-white/60">
                Tasker
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
              Tasker
            </span>
          </div>
        )}
      </header>

      <main className="pb-24 pt-4">
        {/* Status bar */}
        <div className="px-3 pb-3 sm:px-4">
          <div
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              status.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : status.tone === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-[#ded7ee] bg-white text-[#6d668a]"
            }`}
          >
            {busy ? "Refreshing bids…" : status.message}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 px-3 pb-4 sm:gap-3 sm:px-4">
          <SummaryCard
            count={accepted.length}
            label="Accepted"
            color="emerald"
          />
          <SummaryCard count={pending.length} label="Pending" color="amber" />
          <SummaryCard count={rejected.length} label="Rejected" color="red" />
        </div>

        {/* Empty state */}
        {!busy && bids.length === 0 && (
          <div className="mx-3 rounded-xl border border-[#ded7ee] bg-white p-8 text-center shadow-sm sm:mx-4 sm:p-10">
            <Gavel
              className="mx-auto mb-4 h-10 w-10 text-[#ded7ee] sm:h-12 sm:w-12"
              aria-hidden="true"
            />
            <p className="text-base font-extrabold text-[#21145f]">
              No bids yet
            </p>
            <p className="mt-1 text-sm font-semibold text-[#6d668a]">
              Browse tasks and place a bid to get started!
            </p>
            <button
              className="mt-5 rounded-lg bg-[#4f22bd] px-6 py-2.5 text-sm font-bold text-white active:scale-[0.98]"
              type="button"
              onClick={() => router.push("/bids")}
            >
              Browse Tasks
            </button>
          </div>
        )}

        {accepted.length > 0 && (
          <BidSection
            title="✅ Accepted"
            bids={accepted}
            status="accepted"
            router={router}
          />
        )}
        {pending.length > 0 && (
          <BidSection
            title="⏳ Pending"
            bids={pending}
            status="pending"
            router={router}
          />
        )}
        {rejected.length > 0 && (
          <BidSection
            title="❌ Rejected"
            bids={rejected}
            status="rejected"
            router={router}
          />
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 z-30 flex w-full items-center justify-around border-t border-[#ded7ee] bg-white px-1 py-2 shadow-[0_-8px_24px_rgba(41,24,79,0.1)] sm:px-3 sm:py-3">
        <NavTab icon={Home} label="Home" onClick={() => router.push("/")} />
        <NavTab
          icon={ClipboardList}
          label="Tasks"
          onClick={() => router.push("/bids")}
        />
        <NavTab
          icon={Gavel}
          label="My Bids"
          active
          badge={accepted.length}
          onClick={() => {}}
        />
        <NavTab icon={MessageCircle} label="Chat" onClick={() => {}} />
        <NavTab icon={LogOut} label="Logout" onClick={handleLogout} />
      </nav>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({
  count,
  label,
  color,
}: {
  count: number;
  label: string;
  color: "emerald" | "amber" | "red";
}) {
  const styles = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-600",
  };
  return (
    <div
      className={`rounded-xl border px-2 py-2.5 text-center shadow-sm sm:px-3 sm:py-3 ${styles[color]}`}
    >
      <p className="text-xl font-extrabold leading-none sm:text-2xl">{count}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide opacity-80 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function BidSection({
  title,
  bids,
  status,
  router,
}: {
  title: string;
  bids: BidWithTaskStatus[];
  status: BidStatus;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="px-3 pb-2 pt-2 sm:px-4">
      <p className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-[#786fa0] sm:text-xs">
        {title}
      </p>
      <div className="space-y-3">
        {bids.map((bid) => (
          <BidCard key={bid.id} bid={bid} status={status} router={router} />
        ))}
      </div>
    </div>
  );
}

function BidCard({
  bid,
  status,
  router,
}: {
  bid: BidWithTaskStatus;
  status: BidStatus;
  router: ReturnType<typeof useRouter>;
}) {
  const cardStyle: Record<BidStatus, string> = {
    accepted: "border-emerald-200 bg-white",
    pending: "border-[#ded7ee] bg-white",
    rejected: "border-red-100 bg-white",
  };

  const badgeStyle: Record<BidStatus, string> = {
    accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    rejected: "bg-red-100 text-red-600 border-red-200",
  };

  const statusIcon: Record<BidStatus, React.ReactNode> = {
    accepted: (
      <CheckCircle2
        className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5"
        aria-hidden="true"
      />
    ),
    pending: (
      <Gavel
        className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5"
        aria-hidden="true"
      />
    ),
    rejected: (
      <X className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
    ),
  };

  const taskStatus = bid.task_status;
  const isSubmitted = taskStatus === "submitted";
  const isRevision = taskStatus === "revision_requested";
  const isCompleted = taskStatus === "completed";
  const isDisputed = taskStatus === "disputed";
  const isInProgress = taskStatus === "in_progress" || taskStatus === undefined;

  return (
    <div
      className={`rounded-xl border p-3 shadow-[0_2px_12px_rgba(41,24,79,0.07)] sm:p-4 ${cardStyle[status]}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Shield
              className="h-3.5 w-3.5 shrink-0 text-[#4f22bd]"
              aria-hidden="true"
            />
            <p className="truncate text-sm font-extrabold text-[#21145f] sm:text-base">
              {bid.bidder_name ?? `Task #${bid.task_id}`}
            </p>
          </div>
          {bid.message && (
            <p className="mt-1 text-xs font-semibold italic text-[#6d668a] sm:text-sm">
              &quot;{bid.message}&quot;
            </p>
          )}
        </div>

        {/* Amount + status badge — stack vertically on very small screens */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-full bg-[#4f22bd] px-2.5 py-0.5 text-xs font-extrabold text-white sm:px-3 sm:py-1 sm:text-sm">
            Rs {bid.amount}
          </span>
          <span
            className={`flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize sm:gap-1 sm:px-2.5 sm:text-[11px] ${badgeStyle[status]}`}
          >
            {statusIcon[status]}
            {status}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#f0ecfa] pt-2.5 sm:mt-3 sm:gap-x-4 sm:pt-3">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-[#786fa0] sm:text-xs">
          <Zap
            className="h-3 w-3 text-[#4f22bd] sm:h-3.5 sm:w-3.5"
            aria-hidden="true"
          />
          Bid #{bid.id}
        </span>
        {bid.created_at && (
          <span className="text-[11px] font-semibold text-[#786fa0] sm:text-xs">
            {new Date(bid.created_at).toLocaleDateString([], {
              dateStyle: "medium",
            })}
          </span>
        )}
        {status === "accepted" && taskStatus && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold sm:px-2.5 sm:text-[11px] ${
              isCompleted
                ? "bg-emerald-100 text-emerald-700"
                : isSubmitted
                  ? "bg-blue-100 text-blue-700"
                  : isRevision
                    ? "bg-orange-100 text-orange-700"
                    : isDisputed
                      ? "bg-red-100 text-red-700"
                      : "bg-purple-100 text-purple-700"
            }`}
          >
            {isCompleted
              ? "✅ Completed"
              : isSubmitted
                ? "🔍 Under Review"
                : isRevision
                  ? "🔄 Revision"
                  : isDisputed
                    ? "⚠️ Disputed"
                    : "🔨 In Progress"}
          </span>
        )}
      </div>

      {/* CTA blocks */}
      {status === "accepted" && (
        <>
          {isInProgress && (
            <div className="mt-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2.5">
              <p className="text-sm font-extrabold text-emerald-700">
                🚀 Your offer was accepted!
              </p>
              <p className="mt-0.5 text-xs font-semibold text-emerald-600">
                Download the task brief and upload your completed work.
              </p>
              <button
                type="button"
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#4f22bd] px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#3d1a9e] active:scale-[0.98]"
                onClick={() => router.push(`/task/${bid.task_id}/files`)}
              >
                <FolderOpen className="h-4 w-4" aria-hidden="true" />
                Go to File Exchange
              </button>
            </div>
          )}

          {isSubmitted && (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Clock
                  className="h-4 w-4 shrink-0 text-blue-600"
                  aria-hidden="true"
                />
                <p className="text-sm font-extrabold text-blue-700">
                  Work submitted — awaiting review
                </p>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-blue-600">
                The client is reviewing your submission. You&apos;ll be notified
                once they respond.
              </p>
            </div>
          )}

          {isRevision && (
            <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <RotateCcw
                  className="h-4 w-4 shrink-0 text-orange-600"
                  aria-hidden="true"
                />
                <p className="text-sm font-extrabold text-orange-700">
                  Revision requested
                </p>
              </div>
              {bid.revision_note && (
                <div className="mt-2 rounded-md border border-orange-200 bg-white px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-orange-500">
                    Client&apos;s note
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#374151]">
                    {bid.revision_note}
                  </p>
                </div>
              )}
              <button
                type="button"
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-orange-700 active:scale-[0.98]"
                onClick={() => router.push(`/task/${bid.task_id}/files`)}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Re-submit Work
              </button>
            </div>
          )}

          {isCompleted && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <p className="text-sm font-extrabold text-emerald-700">
                  Work approved — great job! 🎉
                </p>
              </div>
              <div className="mt-2 rounded-md border border-emerald-200 bg-white px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">
                  Payment status
                </p>
                <p className="mt-1 text-xs font-semibold text-[#374151]">
                  💰 Payment of{" "}
                  <span className="font-extrabold text-[#4f22bd]">
                    Rs {bid.amount}
                  </span>{" "}
                  is pending. You&apos;ll be notified when it&apos;s processed.
                </p>
              </div>
            </div>
          )}

          {isDisputed && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
              <p className="text-sm font-extrabold text-red-700">
                ⚠️ This task is under dispute
              </p>
              <p className="mt-0.5 text-xs font-semibold text-red-600">
                An admin will review and resolve this shortly.
              </p>
            </div>
          )}
        </>
      )}

      {status === "rejected" && (
        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2">
          <p className="text-xs font-semibold text-red-500">
            This bid was not selected. Try bidding on another task!
          </p>
        </div>
      )}

      {status === "pending" && (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2">
          <p className="text-xs font-semibold text-amber-600">
            Waiting for the client to review your offer.
          </p>
        </div>
      )}
    </div>
  );
}

function NavTab({
  icon: Icon,
  label,
  active = false,
  badge = 0,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  active?: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      className={`relative flex flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-extrabold sm:gap-1 sm:px-2 sm:text-xs ${
        active ? "text-[#4f22bd]" : "text-[#2a1679]"
      }`}
      type="button"
      onClick={onClick}
    >
      <span className="relative flex h-7 w-7 items-center justify-center sm:h-8 sm:w-8">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
        {badge > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white sm:h-5 sm:w-5 sm:text-[10px]">
            {badge}
          </span>
        )}
      </span>
      {label}
    </button>
  );
}
