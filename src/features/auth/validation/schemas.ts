import { z } from "zod";

export const roleSchema = z.enum(["client", "tasker"]);

// The backend still returns its original role names in raw JSON payloads
// (e.g. the login/Google login response). Use this schema only when
// validating data straight off the wire, before it passes through the
// backend<->frontend role mapping in features/auth/services/session.ts.
export const backendRoleSchema = z.enum(["tasker", "taskarmy"]);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: roleSchema,
});

export const registerSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: roleSchema,
});

export const loginResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string().optional(),
  fullName: z.string().optional(),
  email: z.string().optional(),
  role: backendRoleSchema.optional(),
});

// /auth/me — the source of truth for a logged-in user's role. The Google
// token-exchange response never includes a role, so callers must hit this
// endpoint separately to tell a returning user from a brand new one.
export const currentUserSchema = z.object({
  id: z.number(),
  email: z.string(),
  full_name: z.string(),
  role: backendRoleSchema.optional(),
  created_at: z.string().optional(),
});
