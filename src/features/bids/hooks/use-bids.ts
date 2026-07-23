import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bidsApi } from "../api/bids";
import { readBaseUrl } from "@/lib/session-store";
import type { BidCreatePayload, Session } from "@/lib/types";

export function useMyBids(session: Session | undefined) {
  return useQuery({
    queryKey: ["bids", "my", session?.token ?? null],
    queryFn: () => bidsApi.myBids(readBaseUrl(), session!.token),
    enabled: Boolean(session),
  });
}

export function usePlaceBid(session: Session | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: number;
      payload: BidCreatePayload;
    }) => {
      if (!session) throw new Error("Login as a tasker to place a bid.");
      return bidsApi.placeBid(readBaseUrl(), session.token, taskId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useReviewBid(session: Session | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      bidId,
      action,
    }: {
      taskId: number;
      bidId: number;
      action: "accept" | "reject";
    }) => {
      if (!session) throw new Error("Login as a client to review a bid.");
      return action === "accept"
        ? bidsApi.acceptBid(readBaseUrl(), session.token, taskId, bidId)
        : bidsApi.rejectBid(readBaseUrl(), session.token, taskId, bidId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
