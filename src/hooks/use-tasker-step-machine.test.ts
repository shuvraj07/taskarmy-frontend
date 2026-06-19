import { describe, expect, it } from "vitest";
import {
  initialTaskerStepState as initial,
  taskerStepReducer,
} from "@/hooks/use-tasker-step-machine";

describe("taskerStepReducer", () => {
  it("starts in the download step, unhydrated", () => {
    expect(initial).toEqual({
      step: "download",
      hasUploadedWork: false,
      hydrated: false,
    });
  });

  describe("hydrate (first call)", () => {
    it("jumps straight to submitted when the server already has it submitted", () => {
      const next = taskerStepReducer(initial, {
        type: "hydrate",
        alreadySubmitted: true,
        hasBrief: false,
        hasDeliverables: false,
      });
      expect(next).toMatchObject({ step: "submitted", hydrated: true });
    });

    it("unlocks the upload step when a brief exists but nothing was submitted", () => {
      const next = taskerStepReducer(initial, {
        type: "hydrate",
        alreadySubmitted: false,
        hasBrief: true,
        hasDeliverables: false,
      });
      expect(next).toMatchObject({ step: "upload", hydrated: true });
    });

    it("stays on download when there is no brief yet", () => {
      const next = taskerStepReducer(initial, {
        type: "hydrate",
        alreadySubmitted: false,
        hasBrief: false,
        hasDeliverables: false,
      });
      expect(next).toMatchObject({ step: "download", hydrated: true });
    });

    it("does not assume submitted just because deliverables exist", () => {
      // This is the exact bug the original ref-based implementation was
      // written to avoid: leftover deliverable files must not auto-advance
      // the step past what the server actually confirmed.
      const next = taskerStepReducer(initial, {
        type: "hydrate",
        alreadySubmitted: false,
        hasBrief: true,
        hasDeliverables: true,
      });
      expect(next.step).toBe("upload");
      expect(next.hasUploadedWork).toBe(true);
    });
  });

  describe("hydrate (subsequent calls)", () => {
    it("is a no-op once already hydrated, returning the exact same reference", () => {
      const hydrated = taskerStepReducer(initial, {
        type: "hydrate",
        alreadySubmitted: false,
        hasBrief: true,
        hasDeliverables: false,
      });

      const result = taskerStepReducer(hydrated, {
        type: "hydrate",
        alreadySubmitted: true, // a refetch claiming "submitted" should be ignored
        hasBrief: false,
        hasDeliverables: false,
      });

      // Referential equality matters here: React bails out of re-rendering
      // when a reducer returns the same object, which is what makes it safe
      // to call hydrateFromServer on every refetch without an external guard.
      expect(result).toBe(hydrated);
      expect(result.step).toBe("upload");
    });
  });

  describe("explicit user actions", () => {
    it("confirmDownload moves to upload", () => {
      const next = taskerStepReducer(initial, { type: "confirmDownload" });
      expect(next.step).toBe("upload");
    });

    it("filesUploaded moves to upload and marks work as uploaded", () => {
      const next = taskerStepReducer(initial, { type: "filesUploaded" });
      expect(next).toMatchObject({ step: "upload", hasUploadedWork: true });
    });

    it("workSubmitted moves to submitted", () => {
      const uploaded = taskerStepReducer(initial, { type: "filesUploaded" });
      const next = taskerStepReducer(uploaded, { type: "workSubmitted" });
      expect(next.step).toBe("submitted");
    });
  });

  describe("reset", () => {
    it("returns to the initial state, including re-allowing hydration", () => {
      const hydrated = taskerStepReducer(initial, {
        type: "hydrate",
        alreadySubmitted: true,
        hasBrief: false,
        hasDeliverables: false,
      });
      const reset = taskerStepReducer(hydrated, { type: "reset" });
      expect(reset).toEqual(initial);
    });
  });
});
