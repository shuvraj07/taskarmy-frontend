"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { taskArmyApi } from "@/lib/api";
import { readBaseUrl } from "@/lib/session-store";
import type { Role } from "@/lib/types";
import { AuthShell } from "@/components/app-shell";
import { Button, Card, Field, PageHeader, StatusBox } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<Role>("tasker");
  const [fullName, setFullName] = useState("Task Owner");
  const [email, setEmail] = useState("tasker@example.com");
  const [password, setPassword] = useState("password123");
  const [status, setStatus] = useState(
    "Create a Tasker or TaskArmy account from this page.",
  );
  const [tone, setTone] = useState<"neutral" | "success" | "error">("neutral");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const param = searchParams.get("role");
    if (param === "tasker" || param === "taskarmy") {
      chooseRole(param);
    }
  }, [searchParams]);

  function chooseRole(nextRole: Role) {
    setRole(nextRole);
    setFullName(nextRole === "tasker" ? "Task Owner" : "Task Worker");
    setEmail(
      nextRole === "tasker" ? "tasker@example.com" : "worker@example.com",
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const response = await taskArmyApi.register(readBaseUrl(), {
      email,
      password,
      full_name: fullName,
      role,
    });
    setBusy(false);

    if (response.ok) {
      setTone("success");
      setStatus("Registration successful. Redirecting to login...");
      router.push("/login");
      return;
    }

    setTone("error");
    setStatus(response.error ?? "Registration failed.");
  }

  return (
    <AuthShell>
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[360px_1fr] lg:items-start">
        <section className="rounded-lg border border-white/10 bg-white/10 p-6 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">
            Choose your path
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal">
            Create the right account for how you work.
          </h1>
          <p className="mt-4 text-sm leading-6 text-brand-100">
            Taskers publish jobs and accept offers. TaskArmy workers browse jobs
            and compete with strong proposals.
          </p>
        </section>

        <Card className="bg-white">
          <PageHeader
            eyebrow="Account setup"
            title="Registration"
            description="Create a Tasker account to post work or a TaskArmy account to bid on jobs."
          />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <RoleCard
              active={role === "tasker"}
              title="Tasker"
              description="For customers who create tasks and accept bids."
              onClick={() => chooseRole("tasker")}
            />
            <RoleCard
              active={role === "taskarmy"}
              title="TaskArmy"
              description="For workers who browse tasks and submit bids."
              onClick={() => chooseRole("taskarmy")}
            />
          </div>

          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
            <Field
              label="Full name"
              value={fullName}
              onChange={setFullName}
              required
            />
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              required
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              required
            />
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={busy}>
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                {busy ? "Creating..." : "Create account"}
              </Button>
            </div>
          </form>

          <div className="mt-5">
            <StatusBox message={status} tone={tone} />
          </div>

          <p className="mt-5 text-center text-sm text-muted">
            Already registered?{" "}
            <Link
              className="font-semibold text-brand-700 hover:underline"
              href="/login"
            >
              Login here
            </Link>
          </p>
        </Card>
      </div>
    </AuthShell>
  );
}

function RoleCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`rounded-lg border p-4 text-left transition ${
        active
          ? "border-brand-500 bg-brand-50 text-brand-900"
          : "border-line bg-white text-ink hover:border-brand-500"
      }`}
      onClick={onClick}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </button>
  );
}
