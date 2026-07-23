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
