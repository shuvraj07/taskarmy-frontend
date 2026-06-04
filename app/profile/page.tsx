"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, Card } from "@/components/ui";
import { readSessions } from "@/lib/session-store";
import type { Role, Session } from "@/lib/types";

// ─── types ────────────────────────────────────────────────────────────────────

type VerificationItem = {
  label: string;
  verified: boolean;
};

type WorkHistory = {
  role: string;
  category: "Delivery" | "Cleaning" | "Repair" | "Installation" | "Other";
  tasksDone: number;
  period: string;
  highlight: string;
};

type TaskArmyProfile = {
  fullName: string;
  initials: string;
  avatarUrl: string;
  tagline: string;
  location: string;
  email: string;
  memberSince: string;
  totalTasksDone: number;
  rating: number;
  responseRate: number;
  skills: string[];
  verifications: VerificationItem[];
  workHistory: WorkHistory[];
};

type CategoryKey = WorkHistory["category"];
type CategoryStyle = {
  icon: string;
  accent: string;
  bg: string;
  border: string;
};

// ─── category colours ─────────────────────────────────────────────────────────

const categoryConfig: Record<CategoryKey, CategoryStyle> = {
  Delivery: {
    icon: "📦",
    accent: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-400",
  },
  Cleaning: {
    icon: "✨",
    accent: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-400",
  },
  Repair: {
    icon: "🔧",
    accent: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-400",
  },
  Installation: {
    icon: "⚡",
    accent: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-400",
  },
  Other: {
    icon: "💼",
    accent: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-400",
  },
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function maskToken(token: string): string {
  if (token.length <= 12) return `${token.slice(0, 4)}…${token.slice(-4)}`;
  return `${token.slice(0, 6)}…${token.slice(-6)}`;
}

function buildProfile(session: Session): TaskArmyProfile {
  const name = session.fullName ?? session.email;
  const initials = name
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return {
    fullName: name,
    initials,
    avatarUrl:
      session.avatarUrl ?? "https://randomuser.me/api/portraits/men/32.jpg",
    tagline: "Available for tasks · Fast responder",
    location: "Mumbai, India",
    email: session.email,
    memberSince: "Jan 2024",
    totalTasksDone: 47,
    rating: 4.8,
    responseRate: 96,
    skills: ["Delivery", "Assembly", "Cleaning", "Heavy lifting", "Errands"],
    verifications: [
      { label: "Identity confirmed", verified: true },
      { label: "Criminal record clear", verified: true },
      { label: "Address verified", verified: true },
      { label: "Passport / ID checked", verified: true },
      { label: "Phone number verified", verified: true },
    ],
    workHistory: [
      {
        role: "Document delivery runner",
        category: "Delivery",
        tasksDone: 18,
        period: "Mar 2024 – present",
        highlight:
          "Delivered 18 tasks on time across Andheri and BKC with 5-star ratings.",
      },
      {
        role: "Home cleaning assistant",
        category: "Cleaning",
        tasksDone: 15,
        period: "Jan 2024 – Mar 2024",
        highlight:
          "Completed deep-cleaning tasks for apartments across Andheri and Bandra.",
      },
      {
        role: "Furniture assembly",
        category: "Installation",
        tasksDone: 14,
        period: "Feb 2024 – present",
        highlight:
          "Assembled flat-pack furniture and wall-mounted shelves for households.",
      },
    ],
  };
}

// ─── BlueCheck ────────────────────────────────────────────────────────────────

function BlueCheck({ size = "h-5 w-5" }: { size?: string }) {
  return (
    <span
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-blue-600`}
      title="Verified"
    >
      <svg
        className="h-2.5 w-2.5 text-white"
        viewBox="0 0 10 8"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M1 4l3 3 5-6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

// ─── StarRating ───────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= Math.round(rating) ? "text-amber-400" : "text-slate-200"
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-xs font-bold text-slate-700">
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

// ─── TaskArmyProfileCard ──────────────────────────────────────────────────────

function TaskArmyProfileCard({ profile }: { profile: TaskArmyProfile }) {
  const [openWork, setOpenWork] = useState<number | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Banner: avatar + name inside, no overlap */}
      <div className="relative bg-[#21145f] px-5 pb-5 pt-4">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",
            backgroundSize: "14px 14px",
          }}
        />
        <p className="relative text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-300">
          TaskArmy — Worker Profile
        </p>
        <div className="relative mt-3 flex items-center gap-4">
          <img
            className="h-[68px] w-[68px] shrink-0 rounded-full border-4 border-white/20 bg-white/10 object-cover"
            src={profile.avatarUrl}
            alt={`${profile.fullName} profile photo`}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white">
                {profile.fullName}
              </h2>
              <BlueCheck size="h-5 w-5" />
            </div>
            <p className="mt-0.5 text-sm text-purple-200">{profile.tagline}</p>
          </div>
        </div>
      </div>

      {/* Meta row: rating + stats */}
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <StarRating rating={profile.rating} />
            <span className="text-xs text-slate-500">
              {profile.responseRate}% response rate
            </span>
            <span className="text-xs text-slate-500">
              Member since {profile.memberSince}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
              📍 {profile.location}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
              ✉ {profile.email}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <div className="rounded-xl bg-slate-100 px-4 py-2 text-center">
            <p className="text-lg font-bold text-slate-900">
              {profile.totalTasksDone}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Tasks done
            </p>
          </div>
          <div className="rounded-xl bg-slate-100 px-4 py-2 text-center">
            <p className="text-lg font-bold text-slate-900">{profile.rating}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Rating
            </p>
          </div>
          <div className="rounded-xl bg-[#4f22bd] px-4 py-2 text-center">
            <p className="text-lg font-bold text-white">PRO</p>
            <p className="text-[10px] uppercase tracking-wide text-purple-200">
              Verified
            </p>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-5 py-3">
        {profile.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-md border border-purple-100 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Two-column: verification + work history */}
      <div className="grid gap-4 border-t border-slate-100 p-5 lg:grid-cols-2">
        {/* Police verification */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-base">🛡</span>
            <h3 className="flex-1 text-xs font-bold uppercase tracking-widest text-slate-500">
              Police verification
            </h3>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              All clear
            </span>
          </div>
          <ul className="space-y-1.5">
            {profile.verifications.map((v) => (
              <li
                key={v.label}
                className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                {v.verified ? (
                  <BlueCheck size="h-5 w-5" />
                ) : (
                  <span className="h-5 w-5 shrink-0 rounded-full border-2 border-amber-400 bg-amber-100" />
                )}
                <span className="flex-1 text-xs text-slate-700">{v.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    v.verified
                      ? "bg-blue-50 text-blue-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {v.verified ? "Verified" : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Career episodes / work history */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-base">📋</span>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Career episodes
            </h3>
          </div>
          <ul className="space-y-2">
            {profile.workHistory.map((w, i) => {
              const cfg = categoryConfig[w.category];
              return (
                <li
                  key={i}
                  className={`cursor-pointer rounded-lg border bg-white px-3 py-2.5 transition-colors border-l-[3px] ${cfg.border}`}
                  onClick={() => setOpenWork(openWork === i ? null : i)}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${cfg.bg}`}
                    >
                      {cfg.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold ${cfg.accent}`}>
                        {w.role}
                      </p>
                      <p className="text-xs text-slate-500">
                        {w.tasksDone} tasks · {w.period}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.accent}`}
                    >
                      {w.category}
                    </span>
                  </div>
                  {openWork === i && (
                    <p className="mt-2 pl-10 text-xs leading-relaxed text-slate-600">
                      {w.highlight}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── SessionCard ──────────────────────────────────────────────────────────────

function SessionCard({ role, session }: { role: Role; session: Session }) {
  return (
    <Card className="bg-white">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
            {role === "tasker" ? "Tasker profile" : "TaskArmy profile"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">
            {session.fullName ?? session.email}
          </h2>
        </div>
        <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700">
          {role}
        </span>
      </div>
      <div className="mt-5 space-y-3 text-sm text-muted">
        <p>
          <span className="font-semibold text-ink">Email:</span> {session.email}
        </p>
        <p>
          <span className="font-semibold text-ink">Token:</span>{" "}
          {maskToken(session.token)}
        </p>
        <p>
          <span className="font-semibold text-ink">Stored role:</span> {role}
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={role === "tasker" ? "/tasker/tasks" : "/taskarmy/tasks"}>
          <Button type="button">Open dashboard</Button>
        </Link>
        <Link href="/bids">
          <Button type="button" variant="secondary">
            View bids
          </Button>
        </Link>
      </div>
    </Card>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [sessions, setSessions] = useState<Partial<Record<Role, Session>>>({});

  useEffect(() => {
    setSessions(readSessions());
  }, []);

  const availableRoles = (Object.keys(sessions) as Role[]).filter(
    (role) => sessions[role],
  );

  const taskarmySession = sessions["taskarmy"];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page header */}
        <section className="rounded-lg border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
                Profile
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
                Your account details
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                View your TaskArmy worker profile, verification status, and work
                history.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-brand-500 hover:bg-brand-50"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Register
              </Link>
            </div>
          </div>
        </section>

        {/* TaskArmy worker profile card */}
        {taskarmySession ? (
          <TaskArmyProfileCard profile={buildProfile(taskarmySession)} />
        ) : (
          availableRoles.length === 0 && (
            <Card className="bg-white">
              <h2 className="text-lg font-semibold text-ink">
                No TaskArmy profile
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Login or register as TaskArmy to see your worker profile,
                verification status, and work history here.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/login">
                  <Button type="button">Go to login</Button>
                </Link>
                <Link href="/register">
                  <Button type="button" variant="secondary">
                    Create account
                  </Button>
                </Link>
              </div>
            </Card>
          )
        )}

        {/* Session cards for all logged-in roles */}
        {availableRoles.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {availableRoles.map((role) => (
              <SessionCard key={role} role={role} session={sessions[role]!} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
