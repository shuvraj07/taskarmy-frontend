"use client";

import { CheckCircle2, Clock, Send, Shield, Star } from "lucide-react";
import { FormEvent, useState } from "react";
import type { FeedTask } from "./types";
import type { Bid } from "@/lib/types";

const TASKER_AVATAR_URL = "https://randomuser.me/api/portraits/men/32.jpg";

const EXPERIENCE_POOL = [
  {
    role: "Electrical Engineer",
    company: "VoltWorks Pvt. Ltd.",
    period: "Jan 2022 – Dec 2023",
    description:
      "Designed and tested circuit layouts for residential automation projects.",
  },
  {
    role: "Data Entry Specialist",
    company: "BrightPath Solutions",
    period: "Mar 2021 – Dec 2021",
    description:
      "Maintained accurate records across client databases for 50+ accounts.",
  },
  {
    role: "Freelance Graphic Designer",
    company: "Self-employed",
    period: "Jun 2020 – Feb 2021",
    description: "Delivered branding and logo design for small businesses.",
  },
  {
    role: "Content Writer",
    company: "WordCraft Media",
    period: "Sep 2019 – May 2020",
    description: "Wrote SEO-optimized articles and product descriptions.",
  },
];

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
  reviewBids: any[];
  selectedBidId: number | null;
  busy: string | null;
  onSelectBid: (id: number) => void;
  onReject: () => void;
  onAccept: () => void;
  onClose: () => void;
}) {
  const [profileBid, setProfileBid] = useState<any | null>(null);

  if (!reviewTask) return null;

  return (
    <>
      <Dialog title="View Bids" onClose={onClose}>
        <div className="space-y-3">
          <div>
            <p className="text-lg font-bold text-[#21145f]">
              {reviewTask.title}
            </p>
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
              <div
                key={bid.id}
                role="button"
                tabIndex={0}
                className={`w-full rounded-lg border p-3 text-left ${selectedBidId === bid.id ? "border-[#4f22bd] bg-[#f4efff]" : "border-[#ded7ee] bg-white"}`}
                onClick={() => onSelectBid(bid.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelectBid(bid.id);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      className="flex items-center gap-1 font-bold text-[#21145f] hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileBid(bid);
                      }}
                    >
                      <Shield
                        className="h-3.5 w-3.5 shrink-0 text-[#4f22bd]"
                        aria-hidden="true"
                      />
                      {bid.bidder_name ?? `Bidder #${bid.id}`}
                    </button>
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
              </div>
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

      {profileBid && (
        <TaskerProfileModal
          bid={profileBid}
          taskCategory={reviewTask.category}
          onClose={() => setProfileBid(null)}
        />
      )}
    </>
  );
}

function TaskerProfileModal({
  bid,
  taskCategory,
  onClose,
}: {
  bid: Bid;
  taskCategory?: string;
  onClose: () => void;
}) {
  const seed = bid.bidder_id ?? bid.id ?? 1;
  const rating = (4 + (seed % 10) / 10).toFixed(1);
  const tasksCompleted = 8 + (seed % 40);
  const onTimeRate = 88 + (seed % 12);
  const responseTime = ["Within an hour", "Within a few hours", "Same day"][
    seed % 3
  ];
  const otherSkills = ["Data Entry", "Content Writing", "Design", "Media & Social"];
  const skills = Array.from(
    new Set([taskCategory, otherSkills[seed % otherSkills.length]].filter(Boolean)),
  ) as string[];
  const experience = [
    EXPERIENCE_POOL[seed % EXPERIENCE_POOL.length],
    EXPERIENCE_POOL[(seed + 1) % EXPERIENCE_POOL.length],
  ];

  return (
    <Dialog title="Tasker Profile" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <img
            className="h-14 w-14 shrink-0 rounded-full border border-[#ded7ee] object-cover"
            src={TASKER_AVATAR_URL}
            alt=""
          />
          <div className="min-w-0">
            <p className="truncate font-extrabold text-[#21145f]">
              {bid.bidder_name ?? `Bidder #${bid.id}`}
            </p>
            {bid.bidder_email && (
              <p className="truncate text-xs font-semibold text-[#786fa0]">
                {bid.bidder_email}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat icon={Star} label="Rating" value={rating} />
          <Stat
            icon={CheckCircle2}
            label="Tasks done"
            value={String(tasksCompleted)}
          />
          <Stat icon={Clock} label="On-time" value={`${onTimeRate}%`} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#8d86aa]">
            Skills
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-[#f4efff] px-2.5 py-1 text-xs font-bold text-[#4f22bd]"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#8d86aa]">
            Career Episodes
          </p>
          <div className="mt-1.5 space-y-2">
            {experience.map((exp, index) => (
              <div
                key={exp.role + exp.period}
                className="rounded-lg border border-[#ded7ee] bg-white p-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-extrabold text-[#21145f]">
                    <span className="rounded-md bg-[#f4efff] px-1.5 py-0.5 text-[10px] font-extrabold text-[#4f22bd]">
                      CE{index + 1}
                    </span>
                    {exp.role}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#8d86aa]">
                    {exp.period}
                  </p>
                </div>
                <p className="text-xs font-bold text-[#4f22bd]">
                  {exp.company}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#6d668a]">
                  {exp.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#8d86aa]">
            Typical response time
          </p>
          <p className="mt-1 text-sm font-semibold text-[#21145f]">
            {responseTime}
          </p>
        </div>

        <div className="rounded-lg border border-[#ded7ee] bg-[#f8f6ff] p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#8d86aa]">
            Their bid on this task
          </p>
          <p className="mt-1 text-sm font-bold text-[#21145f]">
            Rs {bid.amount}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#6d668a]">
            {bid.message ?? "No message added."}
          </p>
        </div>
      </div>
    </Dialog>
  );
}

export function PosterProfileModal({
  task,
  onClose,
}: {
  task: FeedTask;
  onClose: () => void;
}) {
  const seed = task.id;
  const rating = (4 + (seed % 10) / 10).toFixed(1);
  const tasksPosted = 5 + (seed % 30);
  const paymentSpeed = ["Within a day", "Within a few hours", "Same day"][
    seed % 3
  ];

  return (
    <Dialog title="Client Profile" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <img
            className="h-14 w-14 shrink-0 rounded-full border border-[#ded7ee] object-cover"
            src={TASKER_AVATAR_URL}
            alt=""
          />
          <div className="min-w-0">
            <p className="truncate font-extrabold text-[#21145f]">
              {task.posterName}
            </p>
            <p className="truncate text-xs font-semibold text-[#786fa0]">
              Task poster
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat icon={Star} label="Rating" value={rating} />
          <Stat
            icon={CheckCircle2}
            label="Tasks posted"
            value={String(tasksPosted)}
          />
          <Stat icon={Clock} label="Pays" value={paymentSpeed} />
        </div>

        <div className="rounded-lg border border-[#ded7ee] bg-[#f8f6ff] p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#8d86aa]">
            This task
          </p>
          <p className="mt-1 text-sm font-bold text-[#21145f]">
            {task.title}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#6d668a]">
            Rs {task.budget} · {task.category} · Posted {task.postedAgo}
          </p>
        </div>
      </div>
    </Dialog>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Star;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#ded7ee] bg-white p-2.5">
      <Icon
        className="mx-auto h-4 w-4 text-[#4f22bd]"
        aria-hidden="true"
      />
      <p className="mt-1 text-sm font-extrabold text-[#21145f]">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8d86aa]">
        {label}
      </p>
    </div>
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
