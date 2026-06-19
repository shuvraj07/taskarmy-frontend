"use client";

import {
  ClipboardList,
  Gavel,
  Home,
  LogOut,
  MessageCircle,
  Plus,
} from "lucide-react";

export function BottomNav({
  isClient,
  isTasker,
  roleLabel,
  onHome,
  onBrowseTasks,
  onPost,
  onMyBids,
  onMessages,
  onLogout,
}: {
  isClient: boolean;
  isTasker: boolean;
  roleLabel: string | null;
  onHome: () => void;
  onBrowseTasks: () => void;
  onPost: () => void;
  onMyBids: () => void;
  onMessages: () => void;
  onLogout: () => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 z-30 flex w-full items-center justify-around border-t border-[#ded7ee] bg-white px-3 py-3 text-[#2a1679] shadow-[0_-12px_34px_rgba(41,24,79,0.14)] lg:hidden">
      <BottomTab icon={Home} label="Home" onClick={onHome} />
      <BottomTab
        icon={ClipboardList}
        label="Tasks"
        active
        onClick={onBrowseTasks}
      />
      {isClient && (
        <BottomTab icon={Plus} label="Post" large onClick={onPost} />
      )}
      {isTasker && (
        <BottomTab icon={Gavel} label="My Bids" onClick={onMyBids} />
      )}
      <BottomTab icon={MessageCircle} label="Messages" onClick={onMessages} />
      {roleLabel && (
        <BottomTab icon={LogOut} label="Logout" onClick={onLogout} />
      )}
    </nav>
  );
}

function BottomTab({
  icon: Icon,
  label,
  active = false,
  large = false,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  active?: boolean;
  large?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex flex-col items-center justify-center gap-1 text-xs font-extrabold ${active ? "text-[#4f22bd]" : "text-[#2a1679]"}`}
      type="button"
      onClick={onClick}
    >
      <span
        className={`flex items-center justify-center ${large ? "h-14 w-14 rounded-full bg-[#4f22bd] text-white" : "h-8 w-8"}`}
      >
        <Icon className={large ? "h-8 w-8" : "h-7 w-7"} aria-hidden="true" />
      </span>
      {label}
    </button>
  );
}
