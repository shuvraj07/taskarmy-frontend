import type { Task } from "@/lib/types";

export type TaskCategory =
  | "All"
  | "Data Entry"
  | "Content Writing"
  | "Design"
  | "Media & Social";

export type ChecklistItem = {
  id: string;
  label: string;
  description: string;
};

export type FeedTask = {
  id: number;
  title: string;
  description: string;
  category: Exclude<TaskCategory, "All">;
  location: string;
  posterName: string;
  posterProfileHref: string;
  time: string;
  postedAgo: string;
  budget: number;
  offers: number;
  imageUrl: string;
  checklist: ChecklistItem[];
  liveTask?: Task;
};
