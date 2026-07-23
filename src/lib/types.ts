export type { Role, Session, LoginResponse, UserRegistration, Credentials } from "@/types/user";
export type { Task, TaskPhase, TaskCreatePayload, TaskUpdatePayload } from "@/features/tasks/types/task";
export type { Bid, BidCreatePayload } from "@/types/bid";

export type ApiStatus = "idle" | "loading" | "success" | "error";

export type ApiEnvelope<T = unknown> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
};
