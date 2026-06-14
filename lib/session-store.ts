import type { Role, Session } from "@/lib/types";

const SESSION_KEY = "taskarmy.sessions";
const ACTIVE_ROLE_KEY = "taskarmy.activeRole";
const BASE_URL_KEY = "taskarmy.baseUrl";
const DEFAULT_BASE_URL = "https://taskarmy.onrender.com";
const SESSION_CHANGED_EVENT = "taskarmy-session-changed";
const FALLBACK_SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

function notifySessionChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  if (typeof atob === "function") {
    return atob(padded);
  }

  throw new Error("Base64 decoding is not available.");
}

export function isTokenExpired(token: string, now = Date.now()): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return false;

    const parsed = JSON.parse(decodeBase64Url(payload)) as { exp?: unknown };
    if (typeof parsed.exp !== "number") return false;

    return now >= parsed.exp * 1000;
  } catch {
    return false;
  }
}

function isSessionExpired(session: Session, now = Date.now()): boolean {
  if (isTokenExpired(session.token, now)) return true;
  return Boolean(
    session.savedAt && now - session.savedAt > FALLBACK_SESSION_TTL,
  );
}

function setRoleTokenCookie(role: Role, token: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${role}_token=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}`;
}

function removeRoleTokenCookie(role: Role) {
  if (typeof document === "undefined") return;
  document.cookie = `${role}_token=; path=/; max-age=0`;
}

export function readSessions(): Partial<Record<Role, Session>> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    const sessions = raw
      ? (JSON.parse(raw) as Partial<Record<Role, Session>>)
      : {};
    const roles: Role[] = ["tasker", "taskarmy"];
    let changed = false;

    for (const role of roles) {
      const session = sessions[role];
      if (session && isSessionExpired(session)) {
        delete sessions[role];
        removeRoleTokenCookie(role);
        changed = true;
      }
    }

    if (changed) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
      const activeRole = readActiveRole();
      if (activeRole && !sessions[activeRole]) {
        window.localStorage.removeItem(ACTIVE_ROLE_KEY);
      }
      notifySessionChanged();
    }

    return sessions;
  } catch {
    return {};
  }
}

export function writeSession(session: Session) {
  const sessions = readSessions();
  sessions[session.role] = {
    ...session,
    savedAt: Date.now(),
  };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
  window.localStorage.setItem(ACTIVE_ROLE_KEY, session.role);
  setRoleTokenCookie(session.role, session.token);
  notifySessionChanged();
}

export function readActiveRole(): Role | null {
  if (typeof window === "undefined") return null;
  const role = window.localStorage.getItem(ACTIVE_ROLE_KEY);
  return role === "tasker" || role === "taskarmy" ? role : null;
}

export function removeSession(role: Role) {
  const sessions = readSessions();
  delete sessions[role];
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
  if (readActiveRole() === role) {
    window.localStorage.removeItem(ACTIVE_ROLE_KEY);
  }
  removeRoleTokenCookie(role);
  notifySessionChanged();
}

export function clearSession(role?: Role) {
  if (typeof window === "undefined") return;

  if (role) {
    removeSession(role);
  } else {
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(ACTIVE_ROLE_KEY);

    const roles: Role[] = ["tasker", "taskarmy"];
    roles.forEach(removeRoleTokenCookie);
    notifySessionChanged();
  }
}

export function readActiveSession(): Session | null {
  if (typeof window === "undefined") return null;

  const role = readActiveRole();
  if (!role) return null;

  return readSessions()[role] ?? null;
}

export function subscribeToSessionChanges(listener: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(SESSION_CHANGED_EVENT, listener);
  window.addEventListener("storage", listener);
  window.addEventListener("focus", listener);

  return () => {
    window.removeEventListener(SESSION_CHANGED_EVENT, listener);
    window.removeEventListener("storage", listener);
    window.removeEventListener("focus", listener);
  };
}

export function readBaseUrl() {
  if (typeof window === "undefined") return DEFAULT_BASE_URL;
  return window.localStorage.getItem(BASE_URL_KEY) ?? DEFAULT_BASE_URL;
}

export function writeBaseUrl(baseUrl: string) {
  window.localStorage.setItem(BASE_URL_KEY, baseUrl);
}

// ── NEW: decode user ID from JWT sub claim ────────────────────────────────────
export function readCurrentUserId(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const session = readActiveSession();
    if (!session?.token) return null;

    const payload = session.token.split(".")[1];
    if (!payload) return null;

    const decoded = JSON.parse(decodeBase64Url(payload)) as {
      sub?: string | number;
      user_id?: number;
      id?: number;
    };

    // JWT sub is '3' (string) based on your backend
    const raw = decoded.sub ?? decoded.user_id ?? decoded.id;
    if (raw === undefined || raw === null) return null;

    const id = Number(raw);
    return isNaN(id) ? null : id;
  } catch {
    return null;
  }
}
