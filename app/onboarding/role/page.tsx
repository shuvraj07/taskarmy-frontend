"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Briefcase, HardHat, CheckCircle2 } from "lucide-react";
import { taskArmyApi } from "@/lib/api"; // ← re-enabled
import {
  readBaseUrl,
  readSessions,
  removeSession,
  writeSession,
} from "@/lib/session-store"; // ← readBaseUrl re-enabled
import type { Role } from "@/lib/types";
import { AuthShell } from "@/components/app-shell";
import { Button, StatusBox } from "@/components/ui";

const ROLES: {
  value: Role;
  label: string;
  tagline: string;
  bullets: string[];
  icon: React.ReactNode;
}[] = [
  {
    value: "tasker",
    label: "I'm a Tasker",
    tagline: "Post jobs and manage workers",
    bullets: [
      "Create and publish tasks",
      "Review bids from workers",
      "Accept or reject applicants",
      "Track task progress",
    ],
    icon: <Briefcase className="h-7 w-7" aria-hidden="true" />,
  },
  {
    value: "taskarmy",
    label: "I'm TaskArmy",
    tagline: "Browse jobs and place bids",
    bullets: [
      "Browse available tasks",
      "Submit competitive bids",
      "Build your work history",
      "Get paid for great work",
    ],
    icon: <HardHat className="h-7 w-7" aria-hidden="true" />,
  },
];

export default function OnboardingRolePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [tone, setTone] = useState<"neutral" | "success" | "error">("neutral");

  useEffect(() => {
    const sessions = readSessions();
    if (sessions.tasker?.token) {
      router.replace("/bids");
    }
  }, [router]);

  async function handleConfirm() {
    if (!selected) return;

    setBusy(true);

    const baseUrl = readBaseUrl();
    const sessions = readSessions();
    const existingSession = sessions.tasker ?? sessions.taskarmy ?? null;

    if (!existingSession?.token) {
      setTone("error");
      setStatus("Session expired. Please log in again.");
      setBusy(false);
      router.replace("/login");
      return;
    }

    try {
      // ← backend call re-enabled now that endpoint exists
      const response = await taskArmyApi.updateProfile(
        baseUrl,
        existingSession.token,
        { role: selected },
      );

      if (!response.ok) {
        throw new Error(response.error ?? "Failed to save role");
      }

      // Save confirmed role to localStorage
      writeSession({
        role: selected,
        email: existingSession.email,
        token: existingSession.token,
        fullName: existingSession.fullName,
        avatarUrl: existingSession.avatarUrl,
      });

      // Clean up the placeholder session under the opposite role (login
      // writes a temp "taskarmy" session for new users before this step).
      const otherRole: Role = selected === "tasker" ? "taskarmy" : "tasker";
      if (sessions[otherRole]?.token === existingSession.token) {
        removeSession(otherRole);
      }

      setTone("success");
      setStatus("Role saved! Taking you to bids...");
      router.push("/bids");
    } catch (error) {
      setTone("error");
      setStatus(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }

    setBusy(false);
  }

  return (
    <AuthShell>
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="mb-10 text-center text-white">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-200">
            One last step
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            How will you use TaskArmy?
          </h1>
          <p className="mt-3 text-base text-brand-100">
            Choose your role. You can always update this later in your profile.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {ROLES.map((role) => {
            const isSelected = selected === role.value;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelected(role.value)}
                className={`relative flex flex-col rounded-xl border-2 p-6 text-left transition-all duration-150 ${
                  isSelected
                    ? "border-white bg-white text-ink shadow-lg"
                    : "border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/15"
                }`}
              >
                {isSelected && (
                  <span className="absolute right-4 top-4 text-brand-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                )}

                <span
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${
                    isSelected
                      ? "bg-brand-50 text-brand-700"
                      : "bg-white/10 text-white"
                  }`}
                >
                  {role.icon}
                </span>

                <p className="text-lg font-semibold">{role.label}</p>
                <p
                  className={`mt-1 text-sm ${
                    isSelected ? "text-muted" : "text-brand-100"
                  }`}
                >
                  {role.tagline}
                </p>

                <ul className="mt-4 space-y-2">
                  {role.bullets.map((b) => (
                    <li
                      key={b}
                      className={`flex items-start gap-2 text-sm ${
                        isSelected ? "text-ink" : "text-brand-100"
                      }`}
                    >
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          isSelected ? "bg-brand-600" : "bg-white/50"
                        }`}
                      />
                      {b}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <Button
            type="button"
            className="w-full"
            disabled={!selected || busy}
            onClick={handleConfirm}
          >
            {busy
              ? "Saving your role..."
              : selected
                ? `Continue as ${selected === "tasker" ? "Tasker" : "TaskArmy"}`
                : "Select a role to continue"}
          </Button>
        </div>

        {status && (
          <div className="mt-4">
            <StatusBox message={status} tone={tone} />
          </div>
        )}

        <p className="mt-6 text-center text-sm text-brand-200">
          Already have an account?{" "}
          <button
            type="button"
            className="font-semibold text-white underline underline-offset-2 hover:text-brand-100"
            onClick={() => router.push("/login")}
          >
            Sign in
          </button>
        </p>
      </div>
    </AuthShell>
  );
}
