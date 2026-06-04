"use client";

import { Bell, LogOut, Menu, Shield } from "lucide-react";
import type { Session } from "@/lib/types";

const PROFILE_PHOTO_URL = "https://randomuser.me/api/portraits/men/32.jpg";

export function BidsHeader({
  activeRole,
  activeSession,
  notificationCount,
  onNotifications,
  onLogout,
  onMenu,
  showMenu,
}: {
  activeRole: string | null;
  activeSession: Session | undefined;
  notificationCount: number;
  onNotifications: () => void;
  onLogout: () => void;
  onMenu: () => void;
  showMenu: boolean;
}) {
  const activeProfileName = activeSession?.fullName || activeSession?.email;

  return (
    <>
      <header className="bg-gradient-to-br from-[#5b35c8] via-[#4c24b7] to-[#371184] px-6 pb-7 pt-6 text-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white text-[#4b20b5] shadow-lg">
              <Shield className="h-9 w-9" aria-hidden="true" />
            </div>
            <div>
              <p className="text-3xl font-bold leading-none">TaskArmy</p>
              <p className="mt-1 text-sm font-medium text-white/85">
                Get Things Done — Remotely with TaskArmy
              </p>
              {activeSession && (
                <div className="mt-2 flex items-center gap-2 text-xs font-medium text-white/70">
                  <img
                    className="h-7 w-7 rounded-full border border-white/40 object-cover"
                    src={activeSession?.avatarUrl ?? PROFILE_PHOTO_URL}
                    alt={
                      activeProfileName
                        ? `${activeProfileName} profile photo`
                        : "Profile photo"
                    }
                  />
                  <span className="min-w-0 truncate">{activeProfileName}</span>
                  {activeRole && (
                    <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                      {activeRole === "tasker" ? "Tasker" : "TaskArmy"}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <IconButton label="Notifications" onClick={onNotifications}>
              <Bell className="h-6 w-6" aria-hidden="true" />
              {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold">
                  {notificationCount}
                </span>
              )}
            </IconButton>
            {activeRole ? (
              <IconButton label="Logout" onClick={onLogout}>
                <LogOut className="h-6 w-6" aria-hidden="true" />
              </IconButton>
            ) : (
              <IconButton label="Menu" onClick={onMenu}>
                <Menu className="h-7 w-7" aria-hidden="true" />
              </IconButton>
            )}
          </div>
        </div>
      </header>

      {showMenu && (
        <div className="border-b border-[#ded7ee] bg-white px-6 py-3 text-sm font-semibold text-[#21145f]">
          <div className="grid grid-cols-3 gap-2">
            <button className="rounded-md bg-[#f4efff] px-3 py-2">
              My bids
            </button>
            <button className="rounded-md bg-[#f4efff] px-3 py-2">
              Refresh
            </button>
            <button className="rounded-md bg-[#f4efff] px-3 py-2">Help</button>
          </div>
        </div>
      )}
    </>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="relative flex h-14 w-14 items-center justify-center rounded-lg bg-white/10 text-white shadow-[0_8px_24px_rgba(20,9,63,0.22)] transition hover:bg-white/15"
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
