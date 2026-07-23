import { z } from "zod";

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
