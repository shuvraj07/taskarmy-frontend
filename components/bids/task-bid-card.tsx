"use client";

import {
  Check,
  CheckCircle2,
  FolderOpen,
  ListChecks,
  MapPin,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FeedTask } from "./types";

const deliveryLabel: Record<Exclude<FeedTask["category"], "All">, string> = {
  "Data Entry": "Remote · File delivery",
  "Content Writing": "Remote · Doc/Email",
  Design: "Remote · File delivery",
  "Media & Social": "Remote · Online posting",
};

export function TaskBidCard({
  task,
  bidCount,
  onPlaceBid,
  onViewBids,
  onOpenChecklist,
  onComplete,
  onFiles,
  canPlaceBid,
  canViewBids,
  canComplete,
  showBidLoginPrompt,
  busy,
}: {
  task: FeedTask;
  bidCount: number;
  onPlaceBid: () => void;
  onViewBids: () => void;
  onOpenChecklist: () => void;
  onComplete: () => void;
  onFiles: () => void;
  canPlaceBid: boolean;
  canViewBids: boolean;
  canComplete: boolean;
  showBidLoginPrompt: boolean;
  busy: boolean;
}) {
  const router = useRouter();
  const showPlaceBid = canPlaceBid || showBidLoginPrompt;

  function handlePlaceBidClick() {
    if (canPlaceBid) {
      onPlaceBid();
    } else if (showBidLoginPrompt) {
      router.push("/login");
    }
  }

  function handleFilesClick() {
    if (canViewBids || canPlaceBid) {
      onFiles();
    } else {
      router.push("/login");
    }
  }

  return (
    <article className="min-h-[280px] rounded-lg border border-[#ded7ee] bg-white p-4 shadow-[0_8px_24px_rgba(41,24,79,0.1)]">
      <div className="flex min-w-0 gap-3">
        <div className="relative h-[86px] w-[86px] shrink-0 overflow-hidden rounded-md bg-[#f4efff]">
          <img
            className="h-full w-full object-cover"
            src={task.imageUrl}
            alt={`${task.title} task image`}
          />
          <div className="absolute inset-0 bg-black/5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold leading-tight text-[#21145f]">
            {task.title}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-[#786fa0]">
            <span className="flex items-center gap-1">
              <Shield
                className="h-3 w-3 shrink-0 text-[#4f22bd]"
                aria-hidden="true"
              />
              Posted by{" "}
              <Link
                className="font-extrabold text-[#4f22bd] underline-offset-2 hover:underline"
                href={task.posterProfileHref}
              >
                {task.posterName}
              </Link>
            </span>
            <span aria-hidden="true" className="text-[#ded7ee]">
              ·
            </span>
            <span className="text-[#4f22bd]">{task.postedAgo}</span>
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#21145f]">
            <MapPin
              className="h-4 w-4 shrink-0 text-[#7448db]"
              aria-hidden="true"
            />
            <span className="truncate">
              {deliveryLabel[task.category]} · Due {task.time}
            </span>
          </p>
          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-[#6d668a]">
            {task.description}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#ded7ee] pt-3 text-[#21145f]">
        <Metric label="Budget" value={`Rs ${task.budget}`} />
        <Metric label="Bids" value={`${bidCount} offers`} />
        <Metric label="Category" value={task.category} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#ded7ee] bg-white px-4 text-sm font-extrabold text-[#371184]"
          type="button"
          onClick={onOpenChecklist}
        >
          <ListChecks className="h-4 w-4" aria-hidden="true" />
          Checklist
        </button>

        {(canViewBids || canPlaceBid) && (
          <button
            className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#4f22bd]/30 bg-[#f4efff] px-4 text-sm font-extrabold text-[#4f22bd]"
            type="button"
            onClick={onFiles}
          >
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
            Files
          </button>
        )}

        {canViewBids && (
          <button
            className="min-h-11 rounded-md border border-[#ded7ee] bg-white px-6 text-sm font-extrabold text-[#371184]"
            type="button"
            onClick={onViewBids}
          >
            View Bids
          </button>
        )}

        {showPlaceBid && (
          <button
            className="min-h-11 rounded-md bg-[#4f22bd] px-6 text-sm font-extrabold text-white"
            type="button"
            onClick={handlePlaceBidClick}
          >
            {canPlaceBid ? "Place Bid" : "Login to bid"}
          </button>
        )}

        {canComplete && (
          <button
            className="flex h-11 w-11 items-center justify-center rounded-md border border-[#ded7ee] bg-white text-[#371184]"
            type="button"
            title="Mark complete"
            aria-label="Mark complete"
            onClick={onComplete}
            disabled={busy}
          >
            <Check className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-r border-[#ded7ee] last:border-r-0">
      <p className="truncate text-xs font-semibold">{label}</p>
      <p className="mt-1 truncate text-sm font-extrabold">{value}</p>
    </div>
  );
}
