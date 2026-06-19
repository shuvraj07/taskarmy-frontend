import { useCallback, useEffect, useState } from "react";
import {
  readActiveRole,
  readSessions,
  removeSession,
  subscribeToSessionChanges,
} from "@/lib/session-store";
import type { Role, Session } from "@/lib/types";

export function useAuth() {
  const [sessions, setSessions] = useState<Partial<Record<Role, Session>>>({});
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const sync = useCallback(() => {
    setSessions(readSessions());
    setActiveRole(readActiveRole());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    sync();
    return subscribeToSessionChanges(sync);
  }, [sync]);

  const signOut = useCallback(
    (role: Role) => {
      removeSession(role);
      sync();
    },
    [sync],
  );

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
