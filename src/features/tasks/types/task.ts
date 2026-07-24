import type { Bid } from "@/features/bids/types/bid";

export type TaskPhase =
  | "open"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type TaskCreatePayload = {
  title: string;
  description: string;
  budget: number;
  deadline: string;
};

export type TaskUpdatePayload = Partial<TaskCreatePayload> & {
  status?: TaskPhase;
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
