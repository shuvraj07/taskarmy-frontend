"use client";

import { AppShell } from "@/components/layout/navbar";
import { Button, Card, PageHeader, StatusBox } from "@/components/ui";
import { useWalletStore } from "@/features/payments";

export default function PayoutsPage() {
  const escrow = useWalletStore((state) => state.escrow);
  const confirmPayout = useWalletStore((state) => state.confirmPayout);

  const releasedEntries = Object.values(escrow)
    .filter((entry) => entry.status === "released")
    .sort((a, b) => Number(a.payoutConfirmed) - Number(b.payoutConfirmed));

  const pendingCount = releasedEntries.filter((entry) => !entry.payoutConfirmed).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Operations"
          title="Payouts"
          description="Tasks where escrow has been released. Send the real eSewa transfer to each tasker manually, then mark it as paid."
        />

        {pendingCount > 0 && (
          <StatusBox
            tone="error"
            message={`${pendingCount} payout${pendingCount === 1 ? "" : "s"} still need a real eSewa transfer.`}
          />
        )}

        {releasedEntries.length === 0 && (
          <Card>
            <p className="text-sm text-muted">
              No released payouts yet. Once a client approves a task, it will
              show up here as money owed to the tasker.
            </p>
          </Card>
        )}

        <div className="space-y-3">
          {releasedEntries.map((entry) => (
            <Card key={entry.taskId} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-ink">
                  Task #{entry.taskId} — Rs {entry.amount}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Pay: {entry.payeeName || "Unknown tasker"}
                  {entry.payeeEmail ? ` (${entry.payeeEmail})` : ""}
                </p>
              </div>

              {entry.payoutConfirmed ? (
                <span className="rounded-md border border-mint-100 bg-mint-100 px-3 py-2 text-xs font-semibold text-mint-700">
                  Paid via eSewa
                </span>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => confirmPayout(entry.taskId)}
                >
                  Mark eSewa payment sent
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
