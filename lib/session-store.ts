import type { Role, Session } from "@/lib/types";

const SESSION_KEY = "taskarmy.sessions";
const BASE_URL_KEY = "taskarmy.baseUrl";
const DEFAULT_BASE_URL = "http://127.0.0.1:8000";

export function readSessions(): Partial<Record<Role, Session>> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<Role, Session>>) : {};
  } catch {
    return {};
  }
}

export function writeSession(session: Session) {
  const sessions = readSessions();
  sessions[session.role] = session;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
}

export function removeSession(role: Role) {
  const sessions = readSessions();
  delete sessions[role];
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
}

export function readBaseUrl() {
  if (typeof window === "undefined") return DEFAULT_BASE_URL;
  return window.localStorage.getItem(BASE_URL_KEY) ?? DEFAULT_BASE_URL;
}

export function writeBaseUrl(baseUrl: string) {
  window.localStorage.setItem(BASE_URL_KEY, baseUrl);
}
