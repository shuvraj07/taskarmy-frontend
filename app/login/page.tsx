"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { taskArmyApi } from "@/lib/api";
import { readBaseUrl, readSessions, writeSession } from "@/lib/session-store";
import type { Role } from "@/lib/types";
import { AuthShell } from "@/components/app-shell";
import { Button, Card, Field, PageHeader, StatusBox } from "@/components/ui";

export default function LoginPage() {
  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
    >
      <LoginForm />
    </GoogleOAuthProvider>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<Role>("tasker");
  const [email, setEmail] = useState("tasker@example.com");
  const [password, setPassword] = useState("password123");
  const [status, setStatus] = useState<string>("Ready to connect to your API.");
  const [tone, setTone] = useState<"neutral" | "success" | "error">("neutral");
  const [busy, setBusy] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setBusy(true);
      try {
        const res = await fetch(`${readBaseUrl()}/auth/google/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: codeResponse.access_token,
            role: role,
          }),
        });
        const data = await res.json();
        if (res.ok && data.access_token) {
          const previousSession = readSessions()[role];
          writeSession({
            role,
            email: data.email || email, // assume backend returns email
            token: data.access_token,
            fullName: data.fullName || previousSession?.fullName,
          });
          setTone("success");
          setStatus(
            `${role === "tasker" ? "Tasker" : "TaskArmy"} Google login successful. Redirecting...`,
          );
          router.push(role === "tasker" ? "/tasker/tasks" : "/taskarmy/tasks");
        } else {
          setTone("error");
          setStatus(data.error || "Google login failed.");
        }
      } catch (error) {
        setTone("error");
        setStatus("Google login failed.");
      }
      setBusy(false);
    },
  });

  useEffect(() => {
    const param = searchParams.get("role");
    if (param === "tasker" || param === "taskarmy") {
      chooseRole(param);
    }
  }, [searchParams]);

  function chooseRole(nextRole: Role) {
    setRole(nextRole);
    setEmail(
      nextRole === "tasker" ? "tasker@example.com" : "worker@example.com",
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const response = await taskArmyApi.login(readBaseUrl(), {
      email,
      password,
    });
    setBusy(false);

    if (response.ok && response.data?.access_token) {
      const previousSession = readSessions()[role];
      writeSession({
        role,
        email,
        token: response.data.access_token,
        fullName: previousSession?.fullName,
      });
      setTone("success");
      setStatus(
        `${role === "tasker" ? "Tasker" : "TaskArmy"} login successful. Redirecting...`,
      );
      router.push(role === "tasker" ? "/tasker/tasks" : "/taskarmy/tasks");
      return;
    }

    setTone("error");
    setStatus(response.error ?? "Login failed.");
  }

  return (
    <AuthShell>
      <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <section className="flex min-h-[560px] flex-col justify-between rounded-lg border border-white/10 bg-white/10 p-8 text-white shadow-soft">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Secure role access
            </div>
            <h1 className="mt-8 max-w-2xl text-4xl font-semibold tracking-normal">
              Login to manage tasks, bids, and worker activity.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-brand-100">
              Tasker and TaskArmy accounts stay separate, so every action uses
              the right bearer token.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Tasker" value="Post tasks" />
            <Stat label="TaskArmy" value="Place bids" />
            <Stat label="API" value="Bearer auth" />
          </div>
        </section>

        <Card className="bg-white">
          <PageHeader
            eyebrow="Welcome back"
            title="Login"
            description="Choose the role you want to use, then sign in with your API account."
          />

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-md border border-line bg-paper p-1">
            {(["tasker", "taskarmy"] as Role[]).map((item) => (
              <button
                key={item}
                type="button"
                className={`min-h-11 rounded px-3 text-sm font-semibold ${
                  role === item
                    ? "bg-white text-brand-700 shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
                onClick={() => chooseRole(item)}
              >
                {item === "tasker" ? "Tasker" : "TaskArmy"}
              </button>
            ))}
          </div>

          <form className="mt-5 space-y-4" onSubmit={submit}>
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
            <Button type="submit" className="w-full" disabled={busy}>
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {busy ? "Signing in..." : "Login"}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-line" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted">Or</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => login()}
              disabled={busy}
            >
              Sign in with Google
            </Button>
          </form>

          <div className="mt-4">
            <StatusBox message={status} tone={tone} />
          </div>

          <p className="mt-5 text-center text-sm text-muted">
            New account?{" "}
            <Link
              className="font-semibold text-brand-700 hover:underline"
              href="/register"
            >
              Create one
            </Link>
          </p>
        </Card>
      </div>
    </AuthShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
