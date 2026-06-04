import type { Task } from "@/lib/types";
import type { ChecklistItem, TaskCategory } from "./types";

const sampleChecklists: Record<
  Exclude<TaskCategory, "All">,
  ChecklistItem[]
> = {
  "Data Entry": [
    {
      id: "accuracy",
      label: "Data accuracy",
      description: "Entries match the source without missing rows.",
    },
    {
      id: "format",
      label: "Clean formatting",
      description: "Columns, file names, and sheets are organized clearly.",
    },
    {
      id: "duplicate-check",
      label: "Duplicate check",
      description: "Repeated records are reviewed before delivery.",
    },
  ],
  "Content Writing": [
    {
      id: "brief-match",
      label: "Matches brief",
      description: "Content follows the requested tone, topic, and length.",
    },
    {
      id: "grammar",
      label: "Grammar and clarity",
      description: "Writing is proofread and easy to understand.",
    },
    {
      id: "originality",
      label: "Original work",
      description: "No copied text or low-quality filler content.",
    },
  ],
  Design: [
    {
      id: "brand-fit",
      label: "Brand fit",
      description: "Colors, typography, and layout match the brief.",
    },
    {
      id: "export-quality",
      label: "Export quality",
      description: "Final files are sharp and delivered in useful formats.",
    },
    {
      id: "revision-ready",
      label: "Revision ready",
      description: "Source/editable files are included when needed.",
    },
  ],
  "Media & Social": [
    {
      id: "platform-fit",
      label: "Platform fit",
      description: "Copy and assets fit the selected social platform.",
    },
    {
      id: "schedule-ready",
      label: "Schedule ready",
      description: "Captions, hashtags, and timing notes are prepared.",
    },
    {
      id: "quality-review",
      label: "Quality review",
      description: "Links, tags, and spellings are checked before posting.",
    },
  ],
};

export function formatRelativeTime(
  iso: string | undefined,
  now: number,
): string {
  if (!iso) return "Just posted";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Just posted";
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec} sec ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  const diffWk = Math.floor(diffDay / 7);
  if (diffWk < 5) return `${diffWk} week${diffWk === 1 ? "" : "s"} ago`;
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return `${diffMo} month${diffMo === 1 ? "" : "s"} ago`;
  const diffYr = Math.floor(diffDay / 365);
  return `${diffYr} year${diffYr === 1 ? "" : "s"} ago`;
}

export function inferCategory(
  title: string,
  description = "",
): Exclude<TaskCategory, "All"> {
  const text = `${title} ${description}`.toLowerCase();
  if (
    text.includes("data") ||
    text.includes("excel") ||
    text.includes("entry") ||
    text.includes("spreadsheet") ||
    text.includes("copy paste") ||
    text.includes("scraping")
  )
    return "Data Entry";
  if (
    text.includes("write") ||
    text.includes("content") ||
    text.includes("blog") ||
    text.includes("copy") ||
    text.includes("article") ||
    text.includes("description") ||
    text.includes("seo")
  )
    return "Content Writing";
  if (
    text.includes("design") ||
    text.includes("logo") ||
    text.includes("graphic") ||
    text.includes("banner") ||
    text.includes("thumbnail") ||
    text.includes("figma") ||
    text.includes("canva")
  )
    return "Design";
  if (
    text.includes("social") ||
    text.includes("post") ||
    text.includes("instagram") ||
    text.includes("media") ||
    text.includes("facebook") ||
    text.includes("caption") ||
    text.includes("schedule") ||
    text.includes("reel")
  )
    return "Media & Social";
  return "Content Writing";
}

export function getTaskImageUrl(task: Task): string {
  const taskWithImage = task as Task & {
    image_url?: string;
    imageUrl?: string;
    image?: string;
    photo_url?: string;
    thumbnail_url?: string;
  };
  return (
    taskWithImage.image_url ??
    taskWithImage.imageUrl ??
    taskWithImage.image ??
    taskWithImage.photo_url ??
    taskWithImage.thumbnail_url ??
    `https://picsum.photos/seed/taskarmy-${task.id}/180/180`
  );
}

export function getSampleChecklist(
  category: Exclude<TaskCategory, "All">,
): ChecklistItem[] {
  return sampleChecklists[category];
}

export function buildPosterProfileHref(
  task: Task,
  posterId: number,
  posterName: string,
): string {
  const params = new URLSearchParams();
  params.set("name", posterName);
  const email =
    task.tasker_email ??
    task.owner_email ??
    task.poster?.email ??
    task.owner?.email;
  const avatar = task.poster?.avatar_url ?? task.owner?.avatar_url;
  if (email) params.set("email", email);
  if (avatar) params.set("avatar", avatar);
  const query = params.toString();
  return `/taskarmy/profile/${posterId}${query ? `?${query}` : ""}`;
}

export function getFileEmoji(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return "📄";
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "🖼️";
  if (["zip", "rar", "7z"].includes(ext)) return "🗜️";
  return "📎";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
