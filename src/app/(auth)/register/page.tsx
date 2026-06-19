"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { registerSchema } from "@/lib/schemas";
import { readBaseUrl } from "@/lib/session-store";
import type { Role } from "@/lib/types";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button, Card, Field, PageHeader, StatusBox } from "@/components/ui";

type RegisterFormValues = {
  role: Role;
  full_name: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [status, setStatus] = useState(
    "Create a Client or Tasker account from this page.",
  );
  const [tone, setTone] = useState<"neutral" | "success" | "error">("neutral");
  const [busy, setBusy] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "client",
      full_name: "Task Owner",
      email: "client@example.com",
      password: "password123",
    },
  });

  const role = watch("role");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const param = params.get("role");
    if (param === "client" || param === "tasker") {
      setValue("role", param);
      setValue("full_name", param === "client" ? "Task Owner" : "Task Worker");
      setValue(
        "email",
        param === "client" ? "client@example.com" : "worker@example.com",
      );
    }
  }, [setValue]);

  async function onSubmit(values: RegisterFormValues) {
    setBusy(true);
    const response = await authApi.register(readBaseUrl(), {
      email: values.email,
      password: values.password,
      full_name: values.full_name,
      role: values.role,
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

  function chooseRole(nextRole: Role) {
    setValue("role", nextRole);
    setValue("full_name", nextRole === "client" ? "Task Owner" : "Task Worker");
    setValue(
      "email",
      nextRole === "client" ? "client@example.com" : "worker@example.com",
    );
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
            Clients publish jobs and accept offers. Taskers browse jobs and
            compete with strong proposals.
          </p>
        </section>

        <Card className="bg-white">
          <PageHeader
            eyebrow="Account setup"
            title="Registration"
            description="Create a Client account to post work or a Tasker account to bid on jobs."
          />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <RoleCard
              active={role === "client"}
              title="Client"
              description="For customers who create tasks and accept bids."
              onClick={() => chooseRole("client")}
            />
            <RoleCard
              active={role === "tasker"}
              title="Tasker"
              description="For workers who browse tasks and submit bids."
              onClick={() => chooseRole("tasker")}
            />
          </div>

          <form
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Controller
              name="full_name"
              control={control}
              render={({ field }) => (
                <Field
                  label="Full name"
                  value={field.value}
                  onChange={field.onChange}
                  required
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Field
                  label="Email"
                  type="email"
                  value={field.value}
                  onChange={field.onChange}
                  required
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Field
                  label="Password"
                  type="password"
                  value={field.value}
                  onChange={field.onChange}
                  required
                />
              )}
            />
            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full"
                disabled={busy || isSubmitting}
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                {busy || isSubmitting ? "Creating..." : "Create account"}
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
