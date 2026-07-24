import { useWalletStore } from "./wallet-store";
import type { EscrowPayee } from "./wallet-store";

// The one entry point other features should use to mutate escrow state from
// outside a component's render (e.g. a mutation's onSuccess, or a plain
// action handler) — instead of reaching into useWalletStore.getState()
// directly from unrelated hooks. Reads (balances, escrow) still go straight
// through useWalletStore's selectors from within components.
export const escrowActions = {
  fundEscrow: (taskId: number, amount: number, payee?: EscrowPayee) =>
    useWalletStore.getState().fundEscrow(taskId, amount, payee),
  releaseEscrow: (taskId: number) =>
    useWalletStore.getState().releaseEscrow(taskId),
  refundEscrow: (taskId: number) =>
    useWalletStore.getState().refundEscrow(taskId),
  confirmPayout: (taskId: number) =>
    useWalletStore.getState().confirmPayout(taskId),
};
