"use client";

import {
  Bell,
  CheckCircle2,
  ClipboardList,
  Gavel,
  Home,
  LogOut,
  MessageCircle,
  Shield,
} from "lucide-react";
import type { Role, Session } from "@/lib/types";

const PROFILE_PHOTO_URL = "https://randomuser.me/api/portraits/men/32.jpg";

export function BidsSidebar({
  activeRole,
  activeSession,
  status,
  onHome,
  onBrowseTasks,
  onReviewBids,
  onMyBids,
  onMessages,
  onLogout,
  onLogin,
}: {
  activeRole: Role | null;
  activeSession: Session | undefined;
  status: string;
  onHome: () => void;
  onBrowseTasks: () => void;
  onReviewBids: () => void;
  onMyBids: () => void;
  onMessages: () => void;
  onLogout: () => void;
  onLogin: () => void;
}) {
  const isTasker = activeRole === "tasker";
  const isTaskArmy = activeRole === "taskarmy";
  const roleLabel = isTasker ? "Tasker" : isTaskArmy ? "TaskArmy" : null;
  const activeProfileName = activeSession?.fullName || activeSession?.email;

  return (
    <aside className="hidden border-r border-[#ded7ee] bg-white lg:flex lg:flex-col">
      <div className="sticky top-0 flex h-screen flex-col gap-6 overflow-hidden px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4f22bd] text-white">
            <Shield className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#21145f]">TaskArmy</p>
            <p className="text-sm text-[#6d668a]">
              {isTasker
                ? "Tasker dashboard"
                : isTaskArmy
                  ? "Worker dashboard"
                  : "Bids dashboard"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <SidebarItem icon={Home} label="Home" active onClick={onHome} />
          {isTasker && (
            <>
              <SidebarItem
                icon={ClipboardList}
                label="My Tasks"
                onClick={onBrowseTasks}
              />
              <SidebarItem
                icon={Gavel}
                label="Review Bids"
                onClick={onReviewBids}
              />
            </>
          )}
          {isTaskArmy && (
            <>
              <SidebarItem
                icon={ClipboardList}
                label="Browse Tasks"
                onClick={onBrowseTasks}
              />
              <SidebarItem icon={Gavel} label="My Bids" onClick={onMyBids} />
            </>
          )}
          <SidebarItem
            icon={MessageCircle}
            label="Messages"
            onClick={onMessages}
          />
        </div>

        {roleLabel ? (
          <div className="rounded-xl border border-[#ded7ee] bg-[#f4efff] px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
              <img
                className="h-12 w-12 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
                src={activeSession?.avatarUrl ?? PROFILE_PHOTO_URL}
                alt={
                  activeProfileName
                    ? `${activeProfileName} profile photo`
                    : "Profile photo"
                }
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-[#786fa0]">
                  Logged in as
                </p>
                <p className="mt-1 font-extrabold text-[#4f22bd]">
                  {roleLabel}
                </p>
                <p className="mt-0.5 truncate text-xs text-[#6d668a]">
                  {activeProfileName}
                </p>
              </div>
            </div>
            <button
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
              type="button"
              onClick={onLogout}
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Logout
            </button>
          </div>
        ) : (
          <button
            className="flex items-center justify-center gap-2 rounded-xl bg-[#4f22bd] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#3a1696]"
            type="button"
            onClick={onLogin}
          >
            Login
          </button>
        )}

        <div className="mt-auto rounded-[24px] bg-[#f4efff] p-4 text-sm font-semibold text-[#21145f]">
          <p className="text-xs uppercase tracking-[0.24em] text-[#6d668a]">
            Status
          </p>
          <p className="mt-3 leading-6">{status}</p>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${active ? "bg-[#4f22bd] text-white" : "bg-[#f4efff] text-[#21145f] hover:bg-[#ede8ff]"}`}
      type="button"
      onClick={onClick}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#4f22bd]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      {label}
    </button>
  );
}
