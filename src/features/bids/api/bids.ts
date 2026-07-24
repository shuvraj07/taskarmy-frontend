import type { Bid, BidCreatePayload, Task } from "@/lib/types";
import { bidArraySchema, bidSchema } from "../validation/schemas";
import { taskSchema } from "@/features/tasks/validation/schemas";
import { request, validateResponse } from "@/lib/api/client";

export const bidsApi = {
  placeBid: async (
    baseUrl: string,
    token: string,
    taskId: number,
    body: BidCreatePayload,
  ) => {
    const response = await request<Bid>(
      baseUrl,
      `/tasks/${taskId}/bid`,
      "POST",
      { token, body },
    );
    return validateResponse(response, bidSchema);
  },

  myBids: async (baseUrl: string, token: string) => {
    const response = await request<Bid[]>(baseUrl, "/tasks/my-bids", "GET", {
      token,
    });
    return validateResponse(response, bidArraySchema);
  },

  acceptBid: async (
    baseUrl: string,
    token: string,
    taskId: number,
    bidId: number,
  ) => {
    const response = await request<Task>(
      baseUrl,
      `/tasks/${taskId}/accept-bid/${bidId}`,
      "PUT",
      { token },
    );
    return validateResponse(response, taskSchema);
  },

  rejectBid: async (
    baseUrl: string,
    token: string,
    taskId: number,
    bidId: number,
  ) => {
    const response = await request<Task>(
      baseUrl,
      `/tasks/${taskId}/reject-bid/${bidId}`,
      "PUT",
      { token },
    );
    return validateResponse(response, taskSchema);
  },
};
