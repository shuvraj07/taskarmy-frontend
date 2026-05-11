"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, Card, StatusBox } from "@/components/ui";
import { readSessions } from "@/lib/session-store";
import type { Role, Session } from "@/lib/types";

export default function ProfilePage() {
  const [sessions, setSessions] = useState<Partial<Record<Role, Session>>>({});

  useEffect(() => {
    setSessions(readSessions());
  }, []);

  const availableRoles = (Object.keys(sessions) as Role[]).filter(
    (role) => sessions[role],
  );

  return (
    <AppShell>
      <div className="space-y-6">
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
                View saved sessions and navigate directly to your Tasker or
                TaskArmy dashboard.
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

        {availableRoles.length === 0 ? (
          <Card className="bg-white">
            <h2 className="text-lg font-semibold text-ink">
              No active profile
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              You do not have any saved session in local storage yet. Login as
              Tasker or TaskArmy to store an active profile.
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
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {availableRoles.map((role) => {
              const session = sessions[role]!;
              return (
                <Card key={role} className="bg-white">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
                        {role === "tasker"
                          ? "Tasker profile"
                          : "TaskArmy profile"}
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
                      <span className="font-semibold text-ink">Email:</span>{" "}
                      {session.email}
                    </p>
                    <p>
                      <span className="font-semibold text-ink">Token:</span>{" "}
                      {maskToken(session.token)}
                    </p>
                    <p>
                      <span className="font-semibold text-ink">
                        Stored role:
                      </span>{" "}
                      {role}
                    </p>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link
                      href={
                        role === "tasker" ? "/tasker/tasks" : "/taskarmy/tasks"
                      }
                    >
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
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function maskToken(token: string) {
  if (token.length <= 12) return `${token.slice(0, 4)}…${token.slice(-4)}`;
  return `${token.slice(0, 6)}…${token.slice(-6)}`;
}
