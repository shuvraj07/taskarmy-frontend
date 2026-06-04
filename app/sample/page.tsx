"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, User, Briefcase } from "lucide-react";
import { readSessions, clearSession } from "@/lib/session-store";
import type { Session } from "@/lib/types";

export default function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<"tasker" | "taskarmy" | null>(null);

  useEffect(() => {
    const sessions = readSessions();
    if (sessions.tasker) {
      setSession(sessions.tasker);
      setRole("tasker");
    } else if (sessions.taskarmy) {
      setSession(sessions.taskarmy);
      setRole("taskarmy");
    } else {
      router.push("/login");
    }
  }, [router]);

  function handleLogout() {
    if (role) clearSession(role);
    router.push("/");
  }

  if (!session || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6ff]">
        <p className="text-sm font-semibold text-[#6d668a]">Loading...</p>
      </div>
    );
  }

  const isTasker = role === "tasker";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f6ff] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#ded7ee] bg-white p-8 shadow-[0_8px_32px_rgba(41,24,79,0.1)]">
        {/* Role badge */}
        <div
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${isTasker ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}
        >
          {isTasker ? (
            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {isTasker ? "Tasker" : "TaskArmy"}
        </div>

        {/* Avatar */}
        <div className="mt-6 flex items-center gap-4">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl text-white text-2xl font-bold ${isTasker ? "bg-[#4f22bd]" : "bg-emerald-600"}`}
          >
            {(session.fullName ?? session.email ?? "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-extrabold text-[#21145f]">
              {session.fullName ?? "User"}
            </p>
            <p className="text-sm text-[#6d668a]">{session.email}</p>
          </div>
        </div>

        {/* Info cards */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <InfoCard label="Role" value={isTasker ? "Tasker" : "TaskArmy"} />
          <InfoCard label="Token" value={`${session.token.slice(0, 12)}...`} />
        </div>

        {/* What you can do */}
        <div className="mt-6 rounded-xl border border-[#ded7ee] bg-[#f8f6ff] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#786fa0]">
            What you can do
          </p>
          <ul className="mt-3 space-y-2">
            {(isTasker
              ? [
                  "Post new tasks",
                  "View bids on your tasks",
                  "Accept or reject bids",
                  "Mark tasks as complete",
                ]
              : [
                  "Browse available tasks",
                  "Place bids on tasks",
                  "Track your bid status",
                  "Receive task assignments",
                ]
            ).map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm font-semibold text-[#21145f]"
              >
                <span
                  className={`h-2 w-2 rounded-full ${isTasker ? "bg-[#4f22bd]" : "bg-emerald-500"}`}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-6 grid gap-3">
          <button
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-extrabold text-white ${isTasker ? "bg-[#4f22bd] hover:bg-[#3a1696]" : "bg-emerald-600 hover:bg-emerald-700"}`}
            type="button"
            onClick={() => router.push("/taskarmy/tasks")}
          >
            Go to Tasks
          </button>
          <button
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#ded7ee] bg-white text-sm font-extrabold text-[#21145f] hover:border-[#4f22bd]"
            type="button"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#ded7ee] bg-[#f8f6ff] p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[#786fa0]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-extrabold text-[#21145f]">
        {value}
      </p>
    </div>
  );
}
