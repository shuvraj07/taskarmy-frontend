"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  ClipboardList,
  Gavel,
  LogIn,
  UserPlus,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  readBaseUrl,
  readSessions,
  removeSession,
  subscribeToSessionChanges,
  writeBaseUrl,
} from "@/lib/session-store";
import type { Role, Session } from "@/lib/types";
import { Button } from "@/components/ui";

const links = [
  { href: "/login", label: "Login", icon: LogIn },
  { href: "/register", label: "Register", icon: UserPlus },
  { href: "/tasker/dashboard", label: "Tasker Dashboard", icon: ClipboardList },
  {
    href: "/taskarmy/dashboard",
    label: "Worker Dashboard",
    icon: BriefcaseBusiness,
  },
  { href: "/taskarmy/profile", label: "TaskArmy Profile", icon: User },
  { href: "/bids", label: "Bids", icon: Gavel },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [baseUrl, setBaseUrl] = useState("http://127.0.0.1:8000");
  const [sessions, setSessions] = useState<Partial<Record<Role, Session>>>({});

  useEffect(() => {
    function syncChromeState() {
      setBaseUrl(readBaseUrl());
      setSessions(readSessions());
    }

    syncChromeState();
    const unsubscribe = subscribeToSessionChanges(syncChromeState);
    const intervalId = window.setInterval(syncChromeState, 30_000);

    return () => {
      unsubscribe();
      window.clearInterval(intervalId);
    };
  }, [pathname]);

  function updateBaseUrl(value: string) {
    setBaseUrl(value);
    writeBaseUrl(value);
  }

  function signOut(role: Role) {
    removeSession(role);
    setSessions(readSessions());
  }

  return (
    <main className="min-h-screen">
      <nav className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href="/login" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-600 text-white">
              <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-base font-semibold text-ink">TaskArmy</p>
              <p className="text-xs font-medium text-muted">Work marketplace</p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {links.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
                    active
                      ? "bg-brand-100 text-brand-700"
                      : "text-muted hover:bg-paper hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <section className="border-b border-line bg-brand-50/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted sm:flex-row sm:items-center">
            API
            <input
              className="min-h-9 w-full rounded-md border border-line bg-white px-3 text-sm font-medium text-ink sm:w-80"
              value={baseUrl}
              onChange={(event) => updateBaseUrl(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <SessionPill
              label="Tasker"
              session={sessions.tasker}
              onSignOut={() => signOut("tasker")}
            />
            <SessionPill
              label="TaskArmy"
              session={sessions.taskarmy}
              onSignOut={() => signOut("taskarmy")}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}

function SessionPill({
  label,
  session,
  onSignOut,
}: {
  label: string;
  session?: Session;
  onSignOut: () => void;
}) {
  return (
    <div className="inline-flex min-h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink">
      <span className={session ? "text-mint-700" : "text-muted"}>
        {label}: {session ? session.fullName || session.email : "signed out"}
      </span>
      {session && (
        <Button
          type="button"
          variant="secondary"
          className="min-h-7 px-2 text-xs"
          onClick={onSignOut}
        >
          Logout
        </Button>
      )}
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-brand-900">
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/login" className="flex items-center gap-3 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-brand-700">
              <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-base font-semibold">TaskArmy</span>
          </Link>
          <div className="flex gap-2">
            <Link
              className="rounded-md px-3 py-2 text-sm font-semibold text-brand-100 hover:bg-white/10"
              href="/login"
            >
              Login
            </Link>
            <Link
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-brand-700"
              href="/register"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
