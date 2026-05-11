"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Field, StatusBox, TextArea } from "@/components/ui";
import { readSessions } from "@/lib/session-store";
import type { Role, Session } from "@/lib/types";

export default function TaskArmyProfilePage() {
  const [session, setSession] = useState<Session | undefined>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [experience, setExperience] = useState(
    "3 years of field service and delivery support.",
  );
  const [policeClearance, setPoliceClearance] = useState("Verified");
  const [bio, setBio] = useState(
    "Trusted TaskArmy worker with strong delivery and home support experience.",
  );
  const [status, setStatus] = useState(
    "Update your TaskArmy profile to improve visibility for task posters.",
  );
  const [tone, setTone] = useState<"neutral" | "success" | "error">("neutral");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const taskarmy = readSessions().taskarmy;
    if (taskarmy) {
      setSession(taskarmy);
      setEmail(taskarmy.email);
      setName(taskarmy.fullName ?? "TaskArmy Worker");
    }
  }, []);

  function saveProfile() {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setTone("success");
      setStatus("Profile details saved locally for the demo.");
    }, 500);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-lg border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
                TaskArmy profile
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
                Manage your worker profile
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Add your photo, experience, clearance status, and the details
                task posters need to trust you.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-4xl font-bold text-brand-700">
                {name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="space-y-1 text-right">
                <p className="font-semibold text-ink">Profile strength</p>
                <p className="text-sm text-muted">80% complete</p>
              </div>
            </div>
          </div>
        </section>

        <StatusBox message={status} tone={tone} />

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <Card>
            <h2 className="text-lg font-semibold text-ink">Profile details</h2>
            <div className="mt-5 space-y-4">
              <Field label="Full name" value={name} onChange={setName} />
              <Field label="Email" value={email} onChange={setEmail} />
              <Field
                label="Experience"
                value={experience}
                onChange={setExperience}
              />
              <Field
                label="Police clearance"
                value={policeClearance}
                onChange={setPoliceClearance}
              />
              <TextArea label="Bio" value={bio} onChange={setBio} />
              <Button type="button" onClick={saveProfile} disabled={busy}>
                {busy ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-ink">Verification</h2>
            <div className="mt-4 space-y-4 text-sm text-muted">
              <div className="rounded-lg border border-line bg-brand-50 p-4">
                <p className="font-semibold text-ink">
                  Police report clearance
                </p>
                <p className="mt-2">{policeClearance}</p>
              </div>
              <div className="rounded-lg border border-line bg-brand-50 p-4">
                <p className="font-semibold text-ink">Work experience</p>
                <p className="mt-2">{experience}</p>
              </div>
              <div className="rounded-lg border border-line bg-brand-50 p-4">
                <p className="font-semibold text-ink">
                  Trusted by task posters
                </p>
                <p className="mt-2">
                  Reliable worker for last 120 completed jobs.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
