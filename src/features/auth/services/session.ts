import type { Role, Session } from "@/lib/types";
import { decodeBase64Url } from "@/lib/utils";

const SESSION_KEY = "taskzity.sessions";
const ACTIVE_ROLE_KEY = "taskzity.activeRole";
const BASE_URL_KEY = "taskzity.baseUrl";
const DEFAULT_BASE_URL = "http://127.0.0.1:8000";
const SESSION_CHANGED_EVENT = "taskzity-session-changed";
const FALLBACK_SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

const ROLES: Role[] = ["client", "tasker"];

// Backend roles are still "tasker" (posts tasks) and "taskarmy" (does tasks).
// The frontend now calls these "client" and "tasker" respectively. These two
// helpers are the only place that translation should happen.
export function mapBackendRoleToFrontend(backendRole: string | undefined | null): Role | null {
  if (backendRole === "tasker") return "client";
  if (backendRole === "taskarmy") return "tasker";
  return null;
}

export function mapFrontendRoleToBackend(role: Role): string {
  return role === "client" ? "tasker" : "taskarmy";
}

function notifySessionChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

function decodeTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, now = Date.now()): boolean {
  const payload = decodeTokenPayload(token);
  // Can't even parse this as a token — fail closed rather than letting a
  // corrupted/forged cookie value through as "not expired".
  if (!payload) return true;
  if (typeof payload.exp !== "number") return false;

  return now >= payload.exp * 1000;
}

// How long the role cookie should live, mirroring the token's own `exp`
// claim so the cookie can't outlive (or expire well before) the token it
// stands in for. Falls back to the session TTL for tokens without `exp`.
function tokenMaxAgeSeconds(token: string, now = Date.now()): number {
  const payload = decodeTokenPayload(token);
  const exp = payload && typeof payload.exp === "number" ? payload.exp : null;
  if (exp === null) return FALLBACK_SESSION_TTL / 1000;

  return Math.max(Math.floor((exp * 1000 - now) / 1000), 0);
}

function isSessionExpired(session: Session, now = Date.now()): boolean {
  if (isTokenExpired(session.token, now)) return true;
  return Boolean(
    session.savedAt && now - session.savedAt > FALLBACK_SESSION_TTL,
  );
}

function setRoleTokenCookie(role: Role, token: string) {
  if (typeof document === "undefined") return;
  const maxAge = tokenMaxAgeSeconds(token);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${role}_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
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
    let changed = false;

    for (const role of ROLES) {
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
  return role === "client" || role === "tasker" ? role : null;
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
    ROLES.forEach(removeRoleTokenCookie);
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

export function readCurrentUserId(): number | null {
  if (typeof window === "undefined") return null;

  const session = readActiveSession();
  if (!session?.token) return null;

  const payload = decodeTokenPayload(session.token) as {
    sub?: string | number;
    user_id?: number;
    id?: number;
  } | null;
  if (!payload) return null;

  const raw = payload.sub ?? payload.user_id ?? payload.id;
  if (raw === undefined || raw === null) return null;

  const id = Number(raw);
  return isNaN(id) ? null : id;
}
