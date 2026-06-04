"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ClipboardList,
  FolderOpen,
  Gavel,
  Home,
  LogOut,
  MessageCircle,
  RefreshCw,
  Shield,
  X,
  Zap,
} from "lucide-react";
import { taskArmyApi } from "@/lib/api";
import {
  readActiveRole,
  readBaseUrl,
  readSessions,
  removeSession,
} from "@/lib/session-store";
import type { Bid, Role, Session } from "@/lib/types";

const PROFILE_PHOTO_URL = "https://randomuser.me/api/portraits/men/32.jpg";

type BidStatus = "accepted" | "pending" | "rejected";

export default function MyBidsPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | undefined>();
  const [bids, setBids] = useState<Bid[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [status, setStatus] = useState<{
    message: string;
    tone: "neutral" | "success" | "error";
  }>({ message: "Loading your bids…", tone: "neutral" });
  const [notificationCount, setNotificationCount] = useState(0);

  // ── Bootstrap session ─────────────────────────────────────────────────────
  useEffect(() => {
    const activeRole = readActiveRole();
    if (activeRole !== "taskarmy") {
      router.replace("/login");
      return;
    }
    const sessions = readSessions();
    if (!sessions.taskarmy) {
      router.replace("/login");
      return;
    }
    setSession(sessions.taskarmy);
  }, [router]);

  // ── Fetch bids ────────────────────────────────────────────────────────────
  const fetchBids = useCallback(
    async (sess: Session, silent = false) => {
      if (!silent) setBusy(true);
      const response = await taskArmyApi.myBids(readBaseUrl(), sess.token);
      if (!silent) setBusy(false);

      if (response.ok && response.data) {
        const next = response.data;

        setBids((prev) => {
          const newlyAccepted = next.filter(
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
            const accepted = next.filter((b) => b.status === "accepted").length;
            setStatus({
              message:
                accepted > 0
                  ? `${accepted} bid${accepted > 1 ? "s" : ""} accepted.`
                  : `${next.length} bid${next.length !== 1 ? "s" : ""} loaded.`,
              tone: accepted > 0 ? "success" : "neutral",
            });
          }
          return next;
        });

        setLastUpdated(new Date());
      } else {
        if (response.status === 401 || response.status === 403) {
          removeSession("taskarmy");
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

  // ── Initial load + auto-poll every 30s ───────────────────────────────────
  useEffect(() => {
    if (!session) return;
    void fetchBids(session);
    const id = window.setInterval(() => void fetchBids(session, true), 30_000);
    return () => window.clearInterval(id);
  }, [session, fetchBids]);

  function handleLogout() {
    removeSession("taskarmy" as Role);
    router.push("/login");
  }

  const accepted = bids.filter((b) => b.status === "accepted");
  const pending = bids.filter((b) => !b.status || b.status === "pending");
  const rejected = bids.filter((b) => b.status === "rejected");
  const profileName = session?.fullName || session?.email;

  return (
    <div className="min-h-screen w-full bg-[#f8f6ff]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-gradient-to-br from-[#5b35c8] via-[#4c24b7] to-[#371184] px-4 pb-5 pt-5 text-white shadow-[0_4px_24px_rgba(41,24,79,0.25)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25"
              type="button"
              aria-label="Go back"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <div>
              <p className="text-xl font-extrabold leading-none tracking-tight">
                My Bids
              </p>
              <p className="mt-0.5 text-xs font-medium text-white/70">
                {bids.length} total · {accepted.length} accepted
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="hidden rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white/80 sm:inline">
                Updated{" "}
                {lastUpdated.toLocaleTimeString([], { timeStyle: "short" })}
              </span>
            )}
            <button
              className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25"
              type="button"
              aria-label="Notifications"
              onClick={() => setNotificationCount(0)}
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
                  {notificationCount}
                </span>
              )}
            </button>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25 disabled:opacity-50"
              type="button"
              aria-label="Refresh bids"
              disabled={busy}
              onClick={() => session && void fetchBids(session)}
            >
              <RefreshCw
                className={`h-5 w-5 ${busy ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Profile strip */}
        {session && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2">
            <Image
              src={session.avatarUrl ?? PROFILE_PHOTO_URL}
              alt={profileName ? `${profileName} profile` : "Profile"}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full border border-white/30 object-cover"
              unoptimized
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">
                {profileName}
              </p>
              <p className="text-[11px] font-semibold text-white/60">
                TaskArmy Worker
              </p>
            </div>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
              Worker
            </span>
          </div>
        )}
      </header>

      <main className="pb-28 pt-4">
        {/* ── Status bar ── */}
        <div className="px-4 pb-3">
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

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-3 gap-3 px-4 pb-4">
          <SummaryCard
            count={accepted.length}
            label="Accepted"
            color="emerald"
          />
          <SummaryCard count={pending.length} label="Pending" color="amber" />
          <SummaryCard count={rejected.length} label="Rejected" color="red" />
        </div>

        {/* ── Accepted banner ── */}
        {accepted.length > 0 && (
          <div className="mx-4 mb-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className="h-5 w-5 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <p className="text-sm font-extrabold text-emerald-700">
                🎉 {accepted.length} offer{accepted.length > 1 ? "s" : ""}{" "}
                accepted — time to get to work!
              </p>
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!busy && bids.length === 0 && (
          <div className="mx-4 rounded-xl border border-[#ded7ee] bg-white p-10 text-center shadow-sm">
            <Gavel
              className="mx-auto mb-4 h-12 w-12 text-[#ded7ee]"
              aria-hidden="true"
            />
            <p className="text-base font-extrabold text-[#21145f]">
              No bids yet
            </p>
            <p className="mt-1 text-sm font-semibold text-[#6d668a]">
              Browse tasks and place a bid to get started!
            </p>
            <button
              className="mt-5 rounded-lg bg-[#4f22bd] px-6 py-2.5 text-sm font-bold text-white"
              type="button"
              onClick={() => router.push("/bids")}
            >
              Browse Tasks
            </button>
          </div>
        )}

        {/* ── Accepted section ── */}
        {accepted.length > 0 && (
          <BidSection
            title="✅ Accepted"
            bids={accepted}
            status="accepted"
            router={router}
          />
        )}

        {/* ── Pending section ── */}
        {pending.length > 0 && (
          <BidSection
            title="⏳ Pending"
            bids={pending}
            status="pending"
            router={router}
          />
        )}

        {/* ── Rejected section ── */}
        {rejected.length > 0 && (
          <BidSection
            title="❌ Rejected"
            bids={rejected}
            status="rejected"
            router={router}
          />
        )}
      </main>

      {/* ── Bottom nav ── */}
      <nav className="fixed bottom-0 left-0 z-30 flex w-full items-center justify-around border-t border-[#ded7ee] bg-white px-3 py-3 shadow-[0_-8px_24px_rgba(41,24,79,0.1)]">
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
        <NavTab icon={MessageCircle} label="Messages" onClick={() => {}} />
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
      className={`rounded-xl border px-3 py-3 text-center shadow-sm ${styles[color]}`}
    >
      <p className="text-2xl font-extrabold leading-none">{count}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide opacity-80">
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
  bids: Bid[];
  status: BidStatus;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="px-4 pb-2 pt-2">
      <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-[#786fa0]">
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
  bid: Bid;
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
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    ),
    pending: <Gavel className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    rejected: <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
  };

  return (
    <div
      className={`rounded-xl border p-4 shadow-[0_2px_12px_rgba(41,24,79,0.07)] ${cardStyle[status]}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Shield
              className="h-4 w-4 shrink-0 text-[#4f22bd]"
              aria-hidden="true"
            />
            <p className="truncate font-extrabold text-[#21145f]">
              {bid.bidder_name ?? `Task #${bid.task_id}`}
            </p>
          </div>
          {bid.message && (
            <p className="mt-1.5 text-sm font-semibold italic text-[#6d668a]">
              &quot;{bid.message}&quot;
            </p>
          )}
        </div>

        {/* Amount + status badge */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="rounded-full bg-[#4f22bd] px-3 py-1 text-sm font-extrabold text-white">
            Rs {bid.amount}
          </span>
          <span
            className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ${badgeStyle[status]}`}
          >
            {statusIcon[status]}
            {status}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#f0ecfa] pt-3">
        <span className="flex items-center gap-1 text-xs font-semibold text-[#786fa0]">
          <Zap className="h-3.5 w-3.5 text-[#4f22bd]" aria-hidden="true" />
          Bid #{bid.id}
        </span>
        {bid.created_at && (
          <span className="text-xs font-semibold text-[#786fa0]">
            Placed{" "}
            {new Date(bid.created_at).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        )}
      </div>

      {/* ── Accepted CTA — NOW WITH VIEW FILES BUTTON ── */}
      {status === "accepted" && (
        <div className="mt-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2.5">
          <p className="text-sm font-extrabold text-emerald-700">
            🚀 Your offer was accepted!
          </p>
          <p className="mt-0.5 text-xs font-semibold text-emerald-600">
            Download the task brief and upload your completed work below.
          </p>
          {/* VIEW FILES BUTTON */}
          <button
            type="button"
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#4f22bd] px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#3d1a9e] active:scale-[0.98]"
            onClick={() => router.push(`/task/${bid.task_id}/files`)}
          >
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
            View File Exchange
          </button>
        </div>
      )}

      {/* Rejected note */}
      {status === "rejected" && (
        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2">
          <p className="text-xs font-semibold text-red-500">
            This bid was not selected. Try bidding on another task!
          </p>
        </div>
      )}

      {/* Pending note */}
      {status === "pending" && (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2">
          <p className="text-xs font-semibold text-amber-600">
            Waiting for the tasker to review your offer.
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
      className={`relative flex flex-col items-center justify-center gap-1 text-xs font-extrabold ${
        active ? "text-[#4f22bd]" : "text-[#2a1679]"
      }`}
      type="button"
      onClick={onClick}
    >
      <span className="relative flex h-8 w-8 items-center justify-center">
        <Icon className="h-7 w-7" aria-hidden="true" />
        {badge > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </span>
      {label}
    </button>
  );
}
