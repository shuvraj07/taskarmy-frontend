import { create } from "zustand";
import {
  readActiveRole,
  readSessions,
  removeSession,
  subscribeToSessionChanges,
} from "../services/session";
import type { Role, Session } from "@/lib/types";

type AuthStoreState = {
  sessions: Partial<Record<Role, Session>>;
  activeRole: Role | null;
  isHydrated: boolean;
  sync: () => void;
  signOut: (role: Role) => void;
};

// session-store.ts owns persistence (localStorage + the cookies middleware
// reads). This store is just a reactive cache over it, kept in sync via the
// existing change event so every component sharing useAuth() re-renders from
// one subscription instead of each mounting its own listener.
const useAuthStore = create<AuthStoreState>((set, get) => ({
  sessions: {},
  activeRole: null,
  isHydrated: false,
  sync: () =>
    set({
      sessions: readSessions(),
      activeRole: readActiveRole(),
      isHydrated: true,
    }),
  signOut: (role) => {
    removeSession(role);
    get().sync();
  },
}));

if (typeof window !== "undefined") {
  useAuthStore.getState().sync();
  subscribeToSessionChanges(() => useAuthStore.getState().sync());
}

export function useAuth() {
  const { sessions, activeRole, isHydrated, signOut, sync } = useAuthStore();

  const isClient = activeRole === "client";
  const isTasker = activeRole === "tasker";
  const roleLabel = isClient ? "Client" : isTasker ? "Tasker" : null;
  const activeSession = activeRole ? sessions[activeRole] : undefined;

  return {
    sessions,
    activeRole,
    activeSession,
    isClient,
    isTasker,
    roleLabel,
    signOut,
    refresh: sync,
    isHydrated,
  };
}
