import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/lib/types";

const STARTING_BALANCE = 1000;

export type EscrowStatus = "held" | "released" | "refunded";

export type EscrowPayee = {
  name?: string;
  email?: string;
};

export type EscrowEntry = {
  taskId: number;
  amount: number;
  status: EscrowStatus;
  payeeName?: string;
  payeeEmail?: string;
  // Whether the real-world eSewa transfer has actually been sent. Separate
  // from `status`, which only tracks the in-app simulated escrow state.
  payoutConfirmed: boolean;
};

export type WalletState = {
  balances: Record<Role, number>;
  escrow: Record<number, EscrowEntry>;
  fundEscrow: (taskId: number, amount: number, payee?: EscrowPayee) => void;
  releaseEscrow: (taskId: number) => void;
  refundEscrow: (taskId: number) => void;
  confirmPayout: (taskId: number) => void;
};

// Simulated wallet — no real money and no backend call. A task's budget is
// "held" out of the client's dummy balance the moment a bid is accepted,
// then "released" into the tasker's dummy balance on approval, or
// "refunded" back to the client if the task is cancelled while still held.
// `payoutConfirmed` tracks the separate manual step of actually sending the
// real eSewa transfer once a task is released.
export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balances: { client: STARTING_BALANCE, tasker: STARTING_BALANCE },
      escrow: {},

      fundEscrow: (taskId, amount, payee) => {
        if (get().escrow[taskId]) return;
        set((state) => ({
          balances: { ...state.balances, client: state.balances.client - amount },
          escrow: {
            ...state.escrow,
            [taskId]: {
              taskId,
              amount,
              status: "held",
              payeeName: payee?.name,
              payeeEmail: payee?.email,
              payoutConfirmed: false,
            },
          },
        }));
      },

      releaseEscrow: (taskId) => {
        const entry = get().escrow[taskId];
        if (!entry || entry.status !== "held") return;
        set((state) => ({
          balances: { ...state.balances, tasker: state.balances.tasker + entry.amount },
          escrow: { ...state.escrow, [taskId]: { ...entry, status: "released" } },
        }));
      },

      refundEscrow: (taskId) => {
        const entry = get().escrow[taskId];
        if (!entry || entry.status !== "held") return;
        set((state) => ({
          balances: { ...state.balances, client: state.balances.client + entry.amount },
          escrow: { ...state.escrow, [taskId]: { ...entry, status: "refunded" } },
        }));
      },

      confirmPayout: (taskId) => {
        const entry = get().escrow[taskId];
        if (!entry || entry.status !== "released") return;
        set((state) => ({
          escrow: {
            ...state.escrow,
            [taskId]: { ...entry, payoutConfirmed: true },
          },
        }));
      },
    }),
    { name: "taskzity.wallet" },
  ),
);

// The persist middleware only writes to localStorage — it doesn't push
// updates to other tabs. Without this, a balance change made in the client's
// tab (e.g. releasing escrow) never appears in the tasker's tab until reload.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "taskzity.wallet") {
      void useWalletStore.persist.rehydrate();
    }
  });
}
