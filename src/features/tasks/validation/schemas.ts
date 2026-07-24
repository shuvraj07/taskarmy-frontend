import { z } from "zod";
import { bidArraySchema } from "@/lib/schemas";

export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  budget: z.number(),
  deadline: z.string().optional(),
  status: z.string().optional(),
  owner_id: z.number().optional(),
  owner_name: z.string().optional(),
  owner_email: z.string().optional(),
  tasker_name: z.string().optional(),
  tasker_email: z.string().optional(),
  posted_by: z.string().optional(),
  poster: z
    .object({
      id: z.number().optional(),
      full_name: z.string().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
      avatar_url: z.string().optional(),
    })
    .optional(),
  owner: z
    .object({
      id: z.number().optional(),
      full_name: z.string().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
      avatar_url: z.string().optional(),
    })
    .optional(),
  accepted_bid_id: z.number().nullable().optional(),
  bids: bidArraySchema.optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const taskArraySchema = z.array(taskSchema);
