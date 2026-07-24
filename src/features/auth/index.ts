export { authApi } from "./api/auth";

export {
  mapBackendRoleToFrontend,
  mapFrontendRoleToBackend,
  isTokenExpired,
  readSessions,
  writeSession,
  readActiveRole,
  removeSession,
  clearSession,
  readActiveSession,
  subscribeToSessionChanges,
  readBaseUrl,
  writeBaseUrl,
  readCurrentUserId,
} from "./services/session";

export { useAuth } from "./hooks/use-auth";

export type {
  Role,
  Session,
  LoginResponse,
  UserRegistration,
  Credentials,
} from "./types/user";

export {
  roleSchema,
  backendRoleSchema,
  loginSchema,
  registerSchema,
  loginResponseSchema,
  currentUserSchema,
} from "./validation/schemas";
