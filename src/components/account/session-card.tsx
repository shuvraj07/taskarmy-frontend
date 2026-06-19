"use client";

import Link from "next/link";
import type { Role, Session } from "@/lib/types";
import { Button, Card } from "@/components/ui";

function maskToken(token: string): string {
  if (token.length <= 12) return `${token.slice(0, 4)}…${token.slice(-4)}`;
  return `${token.slice(0, 6)}…${token.slice(-6)}`;
}

export function SessionCard({ role, session }: { role: Role; session: Session }) {
  return (
    <Card className="bg-white">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
            {role === "client" ? "Client profile" : "Tasker profile"}
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
        <Link href={role === "client" ? "/client/tasks" : "/tasker/tasks"}>
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
