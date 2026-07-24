"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  RotateCcw,
  Wallet as WalletIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import {
  useWalletStore,
  type EscrowEntry,
  type EscrowStatus,
} from "@/features/payments";

const statusMeta: Record<
  EscrowStatus,
  { label: string; icon: typeof Clock; className: string }
> = {
  held: {
    label: "Held in escrow",
    icon: Clock,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  released: {
    label: "Released",
    icon: CheckCircle2,
    className: "border-mint-100 bg-mint-100 text-mint-700",
  },
  refunded: {
    label: "Refunded",
    icon: RotateCcw,
    className: "border-line bg-paper text-muted",
  },
};

function sumWhere(entries: EscrowEntry[], status: EscrowStatus) {
  return entries
    .filter((entry) => entry.status === status)
    .reduce((sum, entry) => sum + entry.amount, 0);
}

export default function WalletPage() {
  const router = useRouter();
  const balances = useWalletStore((state) => state.balances);
  const escrow = useWalletStore((state) => state.escrow);

  const entries = Object.values(escrow).sort((a, b) => b.taskId - a.taskId);
  const heldTotal = sumWhere(entries, "held");
  const releasedTotal = sumWhere(entries, "released");
  const pendingPayoutTotal = entries
    .filter((entry) => entry.status === "released" && !entry.payoutConfirmed)
    .reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => router.back()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line text-ink transition hover:bg-paper"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <p className="text-base font-semibold text-ink">Wallet</p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <PageHeader
          eyebrow="Finances"
          title="Wallet"
          description="Simulated balances and escrow activity for both roles. No real money moves here — see Payouts for actual eSewa transfers."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <WalletCard
            label="Client wallet"
            amount={balances.client}
            caption="Available to spend on new tasks"
          />
          <WalletCard
            label="Tasker wallet"
            amount={balances.tasker}
            caption="Available to withdraw"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="In escrow" amount={heldTotal} tone="amber" />
          <StatCard label="Released" amount={releasedTotal} tone="mint" />
          <StatCard
            label="Pending eSewa payout"
            amount={pendingPayoutTotal}
            tone="brand"
          />
        </div>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-base font-semibold text-ink">
              Escrow activity
            </h2>
            <span className="text-xs font-medium text-muted">
              {entries.length} task{entries.length === 1 ? "" : "s"}
            </span>
          </div>

          {entries.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">
              No escrow activity yet. Funds are held here once a client
              accepts a bid.
            </p>
          ) : (
            <div className="divide-y divide-line">
              {entries.map((entry) => {
                const meta = statusMeta[entry.status];
                const StatusIcon = meta.icon;
                return (
                  <div
                    key={entry.taskId}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                        <WalletIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          Task #{entry.taskId}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {entry.payeeName || entry.payeeEmail
                            ? `Tasker: ${entry.payeeName || entry.payeeEmail}`
                            : "No tasker on file"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {meta.label}
                      </span>
                      <div className="w-32 shrink-0 text-right">
                        <p className="text-sm font-semibold text-ink">
                          Rs {entry.amount.toFixed(2)}
                        </p>
                        {entry.status === "released" && (
                          <p
                            className={`text-xs font-medium ${
                              entry.payoutConfirmed
                                ? "text-mint-600"
                                : "text-amber-600"
                            }`}
                          >
                            {entry.payoutConfirmed
                              ? "Paid via eSewa"
                              : "Payout pending"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function WalletCard({
  label,
  amount,
  caption,
}: {
  label: string;
  amount: number;
  caption: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5b35c8] via-[#4c24b7] to-[#371184] p-6 text-white shadow-soft">
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-white/5" />
      <div className="relative flex items-center justify-between">
        <p className="text-sm font-semibold text-white/80">{label}</p>
        <WalletIcon className="h-5 w-5 text-white/70" aria-hidden="true" />
      </div>
      <p className="relative mt-4 text-3xl font-bold tracking-tight">
        Rs {amount.toFixed(2)}
      </p>
      <p className="relative mt-1 text-xs font-medium text-white/60">
        {caption}
      </p>
    </div>
  );
}

function StatCard({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: number;
  tone: "amber" | "mint" | "brand";
}) {
  const toneClass = {
    amber: "text-amber-600",
    mint: "text-mint-600",
    brand: "text-brand-700",
  }[tone];
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className={`text-xl font-semibold ${toneClass}`}>
        Rs {amount.toFixed(2)}
      </p>
    </Card>
  );
}
