"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/navbar";
import { Button, Card } from "@/components/ui";
import { SessionCard, TaskerProfileCard, buildTaskerProfile } from "@/features/users";
import { readSessions } from "@/features/auth";
import type { Role, Session } from "@/lib/types";

export default function ProfilePage() {
  const [sessions, setSessions] = useState<Partial<Record<Role, Session>>>({});

  useEffect(() => {
    setSessions(readSessions());
  }, []);

  const availableRoles = (Object.keys(sessions) as Role[]).filter(
    (role) => sessions[role],
  );

  const taskerSession = sessions["tasker"];

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
                View your Tasker worker profile, verification status, and work
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

        {/* Tasker worker profile card */}
        {taskerSession ? (
          <TaskerProfileCard profile={buildTaskerProfile(taskerSession)} />
        ) : (
          availableRoles.length === 0 && (
            <Card className="bg-white">
              <h2 className="text-lg font-semibold text-ink">
                No Tasker profile
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Login or register as Tasker to see your worker profile,
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
