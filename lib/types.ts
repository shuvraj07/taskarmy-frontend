export type Role = "tasker" | "taskarmy";

export type ApiStatus = "idle" | "loading" | "success" | "error";

export type Session = {
  role: Role;
  token: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  savedAt?: number; // ← ADDED
};

export type ApiEnvelope<T = unknown> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
};

export type LoginResponse = {
  access_token: string;
  token_type?: string;
};

export type UserRegistration = {
  email: string;
  password: string;
  full_name: string;
  role: Role;
};

export type Credentials = {
  email: string;
  password: string;
};

export type TaskCreatePayload = {
  title: string;
  description: string;
  budget: number;
  deadline: string;
};

export type TaskPhase =
  | "open"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type TaskUpdatePayload = Partial<TaskCreatePayload> & {
  status?: TaskPhase;
};

export type BidCreatePayload = {
  amount: number;
  message: string;
};

export type Bid = {
  id: number;
  amount: number;
  message?: string;
  status?: string;
  task_id?: number;
  bidder_id?: number;
  bidder_name?: string;
  bidder_email?: string;
  created_at?: string;
};

export type Task = {
  id: number;
  title: string;
  description?: string;
  budget: number;
  deadline?: string;
  status?: string;
  owner_id?: number;
  owner_name?: string;
  owner_email?: string;
  tasker_name?: string;
  tasker_email?: string;
  posted_by?: string;
  poster?: {
    id?: number;
    full_name?: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  };
  owner?: {
    id?: number;
    full_name?: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  };
  accepted_bid_id?: number | null;
  bids?: Bid[];
  created_at?: string;
  updated_at?: string;
};
