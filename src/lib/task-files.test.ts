import { describe, expect, it, vi } from "vitest";
import {
  derivePassiveFileExchangeError,
  getTaskOwnerId,
  splitTaskFiles,
  uploadFilesSequentially,
  type ApiTask,
} from "@/lib/task-files";
import type { ApiFile } from "@/lib/api/files";

function makeFile(overrides: Partial<ApiFile> = {}): ApiFile {
  return {
    id: 1,
    task_id: 42,
    uploader_id: 100,
    file_url: "https://example.com/file.pdf",
    file_name: "brief.pdf",
    file_type: "application/pdf",
    created_at: "2026-01-15T10:30:00Z",
    ...overrides,
  };
}

describe("getTaskOwnerId", () => {
  it("returns null when no owner field is present", () => {
    expect(getTaskOwnerId({ id: 1 } as ApiTask)).toBeNull();
  });

  it("prefers created_by over every other field", () => {
    const task: ApiTask = {
      id: 1,
      created_by: 10,
      owner_id: 20,
      tasker_id: 30,
      poster: { id: 40 },
      owner: { id: 50 },
    };
    expect(getTaskOwnerId(task)).toBe(10);
  });

  it("falls back through owner_id, tasker_id, poster.id, owner.id in order", () => {
    expect(getTaskOwnerId({ id: 1, owner_id: 20, tasker_id: 30 })).toBe(20);
    expect(getTaskOwnerId({ id: 1, tasker_id: 30, poster: { id: 40 } })).toBe(30);
    expect(getTaskOwnerId({ id: 1, poster: { id: 40 }, owner: { id: 50 } })).toBe(40);
    expect(getTaskOwnerId({ id: 1, owner: { id: 50 } })).toBe(50);
  });

  it("treats a missing nested id as absent, not as 0", () => {
    expect(getTaskOwnerId({ id: 1, poster: {}, owner: { id: 50 } })).toBe(50);
  });
});

describe("splitTaskFiles", () => {
  it("returns empty groups for an empty file list", () => {
    expect(splitTaskFiles([], 1)).toEqual({ briefs: [], deliverables: [] });
  });

  it("maps backend role 'tasker' (the poster) to the client bucket", () => {
    const { briefs, deliverables } = splitTaskFiles(
      [makeFile({ uploader_role: "tasker" })],
      null,
    );
    expect(briefs).toHaveLength(1);
    expect(deliverables).toHaveLength(0);
    expect(briefs[0].uploadedBy).toBe("client");
  });

  it("maps any other backend role (the worker) to the tasker bucket", () => {
    const { briefs, deliverables } = splitTaskFiles(
      [makeFile({ uploader_role: "taskarmy" })],
      null,
    );
    expect(briefs).toHaveLength(0);
    expect(deliverables).toHaveLength(1);
    expect(deliverables[0].uploadedBy).toBe("tasker");
  });

  it("falls back to comparing uploader_id against ownerId when uploader_role is absent", () => {
    const ownerId = 100;
    const fromOwner = makeFile({ uploader_id: ownerId, uploader_role: undefined });
    const fromSomeoneElse = makeFile({ uploader_id: 999, uploader_role: undefined });

    const { briefs, deliverables } = splitTaskFiles(
      [fromOwner, fromSomeoneElse],
      ownerId,
    );
    expect(briefs).toHaveLength(1);
    expect(deliverables).toHaveLength(1);
  });

  it("defaults to the client bucket when there is no role and no ownerId to compare against", () => {
    const file = makeFile({ uploader_role: undefined, uploader_id: 999 });
    const { briefs, deliverables } = splitTaskFiles([file], null);
    expect(briefs).toHaveLength(1);
    expect(deliverables).toHaveLength(0);
  });

  it("partitions a mixed list while preserving each file's own data", () => {
    const ownerId = 5;
    const brief = makeFile({
      id: 1,
      uploader_id: ownerId,
      uploader_role: undefined,
      file_name: "brief.PDF",
    });
    const deliverable = makeFile({
      id: 2,
      uploader_id: 999,
      uploader_role: undefined,
      file_name: "final-result.zip",
    });

    const { briefs, deliverables } = splitTaskFiles([brief, deliverable], ownerId);

    expect(briefs).toHaveLength(1);
    expect(briefs[0]).toMatchObject({ id: "1", name: "brief.PDF", type: "pdf" });

    expect(deliverables).toHaveLength(1);
    expect(deliverables[0]).toMatchObject({
      id: "2",
      name: "final-result.zip",
      type: "zip",
    });
  });

  it("formats uploadedAt as a locale date/time string", () => {
    const { briefs } = splitTaskFiles([makeFile()], null);
    expect(briefs[0].uploadedAt).toMatch(/^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2} [AP]M$/);
  });
});

describe("uploadFilesSequentially", () => {
  function makeFiles(names: string[]): File[] {
    return names.map((name) => new File(["content"], name));
  }

  it("returns ok and calls nothing for an empty file list", async () => {
    const uploadOne = vi.fn();
    const onProgress = vi.fn();

    const result = await uploadFilesSequentially([], uploadOne, onProgress);

    expect(result).toEqual({ ok: true });
    expect(uploadOne).not.toHaveBeenCalled();
    expect(onProgress).not.toHaveBeenCalled();
  });

  it("uploads every file in order and reports progress as a running percentage", async () => {
    const files = makeFiles(["a.txt", "b.txt", "c.txt", "d.txt"]);
    const uploadOne = vi.fn().mockResolvedValue({ ok: true });
    const onProgress = vi.fn();

    const result = await uploadFilesSequentially(files, uploadOne, onProgress);

    expect(result).toEqual({ ok: true });
    expect(uploadOne.mock.calls.map(([file]) => file.name)).toEqual([
      "a.txt",
      "b.txt",
      "c.txt",
      "d.txt",
    ]);
    expect(onProgress.mock.calls).toEqual([[25], [50], [75], [100]]);
  });

  it("stops at the first failure and does not upload the remaining files", async () => {
    const files = makeFiles(["a.txt", "b.txt", "c.txt"]);
    const uploadOne = vi
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, error: "Disk full" });
    const onProgress = vi.fn();

    const result = await uploadFilesSequentially(files, uploadOne, onProgress);

    expect(result).toEqual({ ok: false, error: "Disk full" });
    expect(uploadOne).toHaveBeenCalledTimes(2);
    // Progress only ever reflects fully-completed uploads.
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(33);
  });

  it("falls back to a generic message when a failure doesn't include one", async () => {
    const uploadOne = vi.fn().mockResolvedValue({ ok: false });
    const result = await uploadFilesSequentially(makeFiles(["a.txt"]), uploadOne, vi.fn());
    expect(result).toEqual({ ok: false, error: "Upload failed" });
  });
});

describe("derivePassiveFileExchangeError", () => {
  const base = {
    notLoggedIn: false,
    taskNotFound: false,
    taskId: "42",
    filesErrorMessage: null,
  };

  it("returns null when nothing is wrong", () => {
    expect(derivePassiveFileExchangeError(base)).toBeNull();
  });

  it("prioritizes not-logged-in over every other condition", () => {
    const result = derivePassiveFileExchangeError({
      ...base,
      notLoggedIn: true,
      taskNotFound: true,
      filesErrorMessage: "network error",
    });
    expect(result).toBe("Not logged in. Please login first.");
  });

  it("reports task-not-found (with the task id) when logged in but the task is missing", () => {
    const result = derivePassiveFileExchangeError({
      ...base,
      taskNotFound: true,
      filesErrorMessage: "network error",
    });
    expect(result).toBe("Task #42 not found or you don't have access.");
  });

  it("falls back to the files error message last", () => {
    const result = derivePassiveFileExchangeError({
      ...base,
      filesErrorMessage: "Failed to load files (500)",
    });
    expect(result).toBe("Failed to load files (500)");
  });
});
