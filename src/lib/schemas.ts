import { z } from "zod";

export const roleSchema = z.enum(["client", "tasker"]);

// The backend still returns its original role names in raw JSON payloads
// (e.g. the login/Google login response). Use this schema only when
// validating data straight off the wire, before it passes through the
// backend<->frontend role mapping in lib/session-store.ts.
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

export const bidSchema = z.object({
  id: z.number(),
  amount: z.number(),
  message: z.string().optional(),
  status: z.string().optional(),
  task_id: z.number().optional(),
  bidder_id: z.number().optional(),
  bidder_name: z.string().optional(),
  bidder_email: z.string().optional(),
  created_at: z.string().optional(),
});

export const bidArraySchema = z.array(bidSchema);

export const registerResponseSchema = z.unknown();
export const rootResponseSchema = z.unknown();
export const healthResponseSchema = z.unknown();
