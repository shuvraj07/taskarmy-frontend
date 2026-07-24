import type { Session } from "@/lib/types";

export type VerificationItem = {
  label: string;
  verified: boolean;
};

export type WorkHistory = {
  role: string;
  category: "Delivery" | "Cleaning" | "Repair" | "Installation" | "Other";
  tasksDone: number;
  period: string;
  highlight: string;
};

export type TaskerProfile = {
  fullName: string;
  initials: string;
  avatarUrl: string;
  tagline: string;
  location: string;
  email: string;
  memberSince: string;
  totalTasksDone: number;
  rating: number;
  responseRate: number;
  skills: string[];
  verifications: VerificationItem[];
  workHistory: WorkHistory[];
};

export function buildTaskerProfile(session: Session): TaskerProfile {
  const name = session.fullName ?? session.email;
  const initials = name
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return {
    fullName: name,
    initials,
    avatarUrl:
      session.avatarUrl ?? "https://randomuser.me/api/portraits/men/32.jpg",
    tagline: "Available for tasks · Fast responder",
    location: "Mumbai, India",
    email: session.email,
    memberSince: "Jan 2024",
    totalTasksDone: 47,
    rating: 4.8,
    responseRate: 96,
    skills: ["Delivery", "Assembly", "Cleaning", "Heavy lifting", "Errands"],
    verifications: [
      { label: "Identity confirmed", verified: true },
      { label: "Criminal record clear", verified: true },
      { label: "Address verified", verified: true },
      { label: "Passport / ID checked", verified: true },
      { label: "Phone number verified", verified: true },
    ],
    workHistory: [
      {
        role: "Document delivery runner",
        category: "Delivery",
        tasksDone: 18,
        period: "Mar 2024 – present",
        highlight:
          "Delivered 18 tasks on time across Andheri and BKC with 5-star ratings.",
      },
      {
        role: "Home cleaning assistant",
        category: "Cleaning",
        tasksDone: 15,
        period: "Jan 2024 – Mar 2024",
        highlight:
          "Completed deep-cleaning tasks for apartments across Andheri and Bandra.",
      },
      {
        role: "Furniture assembly",
        category: "Installation",
        tasksDone: 14,
        period: "Feb 2024 – present",
        highlight:
          "Assembled flat-pack furniture and wall-mounted shelves for households.",
      },
    ],
  };
}
