"use client";

import { useCallback, useState } from "react";
import { readActiveRole, readSessions } from "@/features/auth";
import type { Role, Session } from "@/lib/types";

export function useBidsSession() {
  const [clientSession, setClientSession] = useState<Session>();
  const [taskerSession, setTaskerSession] = useState<Session>();
  const [activeRole, setActiveRole] = useState<Role | null>(null);

  const isClient = activeRole === "client";
  const isTasker = activeRole === "tasker";
  const roleLabel = isClient ? "Client" : isTasker ? "Tasker" : null;
  const activeSession = isClient
    ? clientSession
    : isTasker
      ? taskerSession
      : undefined;

  const syncSessionState = useCallback(
    (triggerLoadTasks: (s: Session, role: Role) => void) => {
      const sessions = readSessions();
      const nextActiveRole = readActiveRole();
      setActiveRole(nextActiveRole);
      setClientSession(
        nextActiveRole === "client" ? sessions.client : undefined,
      );
      setTaskerSession(
        nextActiveRole === "tasker" ? sessions.tasker : undefined,
      );
      if (nextActiveRole === "tasker" && sessions.tasker) {
        triggerLoadTasks(sessions.tasker, "tasker");
      } else if (nextActiveRole === "client" && sessions.client) {
        triggerLoadTasks(sessions.client, "client");
      }
    },
    [],
  );

  return {
    clientSession,
    setClientSession,
    taskerSession,
    setTaskerSession,
    activeRole,
    setActiveRole,
    isClient,
    isTasker,
    roleLabel,
    activeSession,
    syncSessionState,
  };
}
