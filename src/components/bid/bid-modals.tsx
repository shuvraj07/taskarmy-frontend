"use client";

import { Send, Shield } from "lucide-react";
import { FormEvent } from "react";
import type { FeedTask } from "@/components/bid/types";
import type { Bid } from "@/lib/types";

export function PlaceBidModal({
  selectedTask,
  bidAmount,
  bidMessage,
  busy,
  onAmountChange,
  onMessageChange,
  onSubmit,
  onClose,
}: {
  selectedTask: FeedTask | null;
  bidAmount: string;
  bidMessage: string;
  busy: boolean;
  onAmountChange: (v: string) => void;
  onMessageChange: (v: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  if (!selectedTask) return null;

  return (
    <Dialog title="Place Bid" onClose={onClose}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <p className="text-lg font-bold text-[#21145f]">
            {selectedTask.title}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-[#786fa0]">
            Posted by {selectedTask.posterName}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#6d668a]">
            Budget Rs {selectedTask.budget} · {selectedTask.category}
          </p>
        </div>
        <label className="block">
          <span className="text-sm font-bold text-[#21145f]">Your amount</span>
          <input
            className="mt-1 min-h-12 w-full rounded-md border border-[#ded7ee] px-3 text-base font-bold text-[#21145f]"
            type="number"
            min="1"
            value={bidAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-[#21145f]">Message</span>
          <textarea
            className="mt-1 min-h-24 w-full resize-none rounded-md border border-[#ded7ee] px-3 py-2 text-sm font-semibold text-[#21145f]"
            value={bidMessage}
            onChange={(e) => onMessageChange(e.target.value)}
          />
        </label>
        <button
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#4f22bd] text-base font-bold text-white"
          disabled={busy}
          type="submit"
        >
          <Send className="h-5 w-5" aria-hidden="true" />
          {busy ? "Sending..." : "Place Bid"}
        </button>
      </form>
    </Dialog>
  );
}

export function ViewBidsModal({
  reviewTask,
  reviewBids,
  selectedBidId,
  busy,
  onSelectBid,
  onReject,
  onAccept,
  onClose,
}: {
  reviewTask: FeedTask | null;
  reviewBids: Bid[];
  selectedBidId: number | null;
  busy: string | null;
  onSelectBid: (id: number) => void;
  onReject: () => void;
  onAccept: () => void;
  onClose: () => void;
}) {
  if (!reviewTask) return null;

  return (
    <Dialog title="View Bids" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <p className="text-lg font-bold text-[#21145f]">{reviewTask.title}</p>
          <p className="mt-0.5 text-xs font-semibold text-[#786fa0]">
            Posted by {reviewTask.posterName}
          </p>
        </div>
        {reviewBids.length === 0 ? (
          <div className="rounded-lg border border-[#ded7ee] bg-[#f8f6ff] p-4 text-sm font-semibold text-[#6d668a]">
            No real bids have been placed on this task yet.
          </div>
        ) : (
          reviewBids.map((bid) => (
            <button
              key={bid.id}
              className={`w-full rounded-lg border p-3 text-left ${selectedBidId === bid.id ? "border-[#4f22bd] bg-[#f4efff]" : "border-[#ded7ee] bg-white"}`}
              type="button"
              onClick={() => onSelectBid(bid.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1 font-bold text-[#21145f]">
                    <Shield
                      className="h-3.5 w-3.5 shrink-0 text-[#4f22bd]"
                      aria-hidden="true"
                    />
                    {bid.bidder_name ?? `Bidder #${bid.id}`}
                  </p>
                  {bid.bidder_email && (
                    <p className="mt-0.5 truncate text-xs font-semibold text-[#786fa0]">
                      {bid.bidder_email}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-[#4f22bd] px-3 py-1 text-sm font-bold text-white">
                  Rs {bid.amount}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[#6d668a]">
                {bid.message ?? "No message added."}
              </p>
              <p className="mt-2 text-xs font-bold uppercase text-[#8d86aa]">
                {bid.status ?? "pending"}
              </p>
            </button>
          ))
        )}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            className="min-h-12 rounded-md border border-[#ded7ee] bg-white font-bold text-[#21145f]"
            onClick={onReject}
            disabled={busy === "reject" || selectedBidId === null}
            type="button"
          >
            Reject
          </button>
          <button
            className="min-h-12 rounded-md bg-[#4f22bd] font-bold text-white"
            onClick={onAccept}
            disabled={busy === "accept" || selectedBidId === null}
            type="button"
          >
            Accept
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export function ChecklistModal({
  checklistTask,
  onClose,
}: {
  checklistTask: FeedTask | null;
  onClose: () => void;
}) {
  if (!checklistTask) return null;

  return (
    <Dialog title="Task Checklist" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="text-lg font-bold text-[#21145f]">
            {checklistTask.title}
          </p>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-[#786fa0]">
            {checklistTask.category}
          </p>
          <p className="mt-2 rounded-md border border-[#ded7ee] bg-white p-3 text-sm font-semibold leading-5 text-[#6d668a]">
            {checklistTask.description}
          </p>
        </div>
        <div className="space-y-2">
          {checklistTask.checklist.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 rounded-lg border border-[#ded7ee] bg-[#f8f6ff] p-3"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#4f22bd] bg-white text-[#4f22bd]">
                ✓
              </span>
              <div className="min-w-0">
                <p className="font-extrabold text-[#21145f]">{item.label}</p>
                <p className="mt-0.5 text-sm font-semibold text-[#6d668a]">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  );
}

function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-4 pb-4 sm:items-center sm:pb-0">
      <section className="w-full max-w-[480px] rounded-lg bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-[#21145f]">{title}</h2>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-md bg-[#f4efff] text-[#21145f]"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
