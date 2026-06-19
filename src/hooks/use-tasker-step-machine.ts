import { useCallback, useEffect, useReducer } from "react";

// The Tasker's progress through a task is purely controlled by explicit user
// actions and server state — it is NEVER derived from "deliverable files
// exist" alone, since that would make the UI auto-advance behind the user's
// back (e.g. re-opening a task with leftover files would silently jump to
// "submitted").
// "download"  = brief not yet acknowledged
// "upload"    = brief acknowledged, user can upload + submit
// "submitted" = user clicked Submit AND the server confirmed it
export type TaskerStep = "download" | "upload" | "submitted";

export type TaskerStepState = {
  step: TaskerStep;
  hasUploadedWork: boolean;
  hydrated: boolean;
};

type TaskerStepAction =
  | { type: "reset" }
  | {
      type: "hydrate";
      alreadySubmitted: boolean;
      hasBrief: boolean;
      hasDeliverables: boolean;
    }
  | { type: "confirmDownload" }
  | { type: "filesUploaded" }
  | { type: "workSubmitted" };

export const initialTaskerStepState: TaskerStepState = {
  step: "download",
  hasUploadedWork: false,
  hydrated: false,
};

export function taskerStepReducer(
  state: TaskerStepState,
  action: TaskerStepAction,
): TaskerStepState {
  switch (action.type) {
    case "reset":
      return initialTaskerStepState;

    case "hydrate": {
      // Restore the step from the server exactly once. Every later call
      // (e.g. a refetch after upload/delete) is a no-op — this is the
      // invariant that used to depend on an external "isInitialLoad" ref;
      // here it's enforced by the reducer itself, not by caller discipline.
      if (state.hydrated) return state;
      const step: TaskerStep = action.alreadySubmitted
        ? "submitted"
        : action.hasBrief
          ? "upload"
          : "download";
      return {
        step,
        hasUploadedWork: state.hasUploadedWork || action.hasDeliverables,
        hydrated: true,
      };
    }

    case "confirmDownload":
      return { ...state, step: "upload" };

    case "filesUploaded":
      return { ...state, step: "upload", hasUploadedWork: true };

    case "workSubmitted":
      return { ...state, step: "submitted" };

    default:
      return state;
  }
}

export function useTaskerStepMachine(taskId: string) {
  const [state, dispatch] = useReducer(taskerStepReducer, initialTaskerStepState);

  // A new taskId means a brand new step machine — re-allow hydration.
  useEffect(() => {
    dispatch({ type: "reset" });
  }, [taskId]);

  // dispatch is stable across renders (React guarantees this for
  // useReducer), so wrapping these in useCallback gives callers stable
  // function identities too — safe to drop straight into a dependency array.
  const hydrateFromServer = useCallback(
    (args: {
      alreadySubmitted: boolean;
      hasBrief: boolean;
      hasDeliverables: boolean;
    }) => dispatch({ type: "hydrate", ...args }),
    [],
  );
  const confirmDownload = useCallback(
    () => dispatch({ type: "confirmDownload" }),
    [],
  );
  const markFilesUploaded = useCallback(
    () => dispatch({ type: "filesUploaded" }),
    [],
  );
  const markWorkSubmitted = useCallback(
    () => dispatch({ type: "workSubmitted" }),
    [],
  );

  return {
    step: state.step,
    hasUploadedWork: state.hasUploadedWork,
    hydrateFromServer,
    confirmDownload,
    markFilesUploaded,
    markWorkSubmitted,
  };
}
