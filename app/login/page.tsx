"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { taskArmyApi } from "@/lib/api";
import { readBaseUrl, writeSession } from "@/lib/session-store";
import type { Role } from "@/lib/types";
import { AuthShell } from "@/components/app-shell";
import { Button, Card, PageHeader, StatusBox } from "@/components/ui";

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
  const [status, setStatus] = useState<string>(
    "Sign in with Google to get started.",
  );
  const [tone, setTone] = useState<"neutral" | "success" | "error">("neutral");
  const [busy, setBusy] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      console.log("━━━ GOOGLE LOGIN STARTED ━━━");
      setBusy(true);

      try {
        // STEP 2 — get Google user info
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          { headers: { Authorization: `Bearer ${codeResponse.access_token}` } },
        );
        const userInfo = await userInfoRes.json();

        if (!userInfoRes.ok) {
          throw new Error("Failed to get Google user info");
        }

        // STEP 3 — exchange with backend
        const baseUrl = readBaseUrl();
        const backendResponse = await taskArmyApi.googleLogin(baseUrl, {
          token: codeResponse.access_token,
        });

        if (!backendResponse.ok || !backendResponse.data?.access_token) {
          throw new Error(backendResponse.error ?? "Backend auth failed");
        }

        // STEP 4 — check if backend already knows this user's role
        const backendRole = (backendResponse.data as { role?: string }).role as
          | Role
          | undefined;

        // STEP 5 — save session and redirect
        if (backendRole === "tasker" || backendRole === "taskarmy") {
          // Returning user — go straight to dashboard
          writeSession({
            role: backendRole,
            email: userInfo.email,
            token: backendResponse.data.access_token,
            fullName: userInfo.name,
            avatarUrl: userInfo.picture,
          });
          setTone("success");
          setStatus("Welcome back! Redirecting to bids...");
          router.push("/bids");
        } else {
          // New user — save temp session and go to onboarding to pick role
          writeSession({
            role: "taskarmy", // temp placeholder until onboarding sets real role
            email: userInfo.email,
            token: backendResponse.data.access_token,
            fullName: userInfo.name,
            avatarUrl: userInfo.picture,
          });
          setTone("success");
          setStatus("Almost there! Please choose your role...");
          router.push("/onboarding/role"); // ← re-enabled
        }

        console.log("━━━ GOOGLE LOGIN COMPLETE ✓ ━━━");
      } catch (error) {
        console.error("━━━ GOOGLE LOGIN FAILED ✗ ━━━", error);
        setTone("error");
        setStatus(
          error instanceof Error ? error.message : "Google login failed",
        );
      }

      setBusy(false);
    },
    scope: "profile email",
    prompt: "select_account",
    onError(error) {
      console.error("━━━ GOOGLE OAUTH ERROR ✗ ━━━", error);
      setTone("error");
      setStatus("Google login failed");
      setBusy(false);
    },
  });

  return (
    <AuthShell>
      <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <section className="flex min-h-[560px] flex-col justify-between rounded-lg border border-white/10 bg-white/10 p-8 text-white shadow-soft">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Secure access
            </div>
            <h1 className="mt-8 max-w-2xl text-4xl font-semibold tracking-normal">
              Login to manage tasks, bids, and worker activity.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-brand-100">
              Sign in once with Google. We will ask you to choose your role
              right after — no need to decide now.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Step 1" value="Sign in" />
            <Stat label="Step 2" value="Pick role" />
            <Stat label="Step 3" value="Get started" />
          </div>
        </section>

        <Card className="bg-white">
          <PageHeader
            eyebrow="Welcome"
            title="Sign in"
            description="We will ask you to choose Tasker or TaskArmy right after login."
          />

          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => login()}
              disabled={busy}
            >
              <GoogleIcon />
              {busy ? "Signing in..." : "Continue with Google"}
            </Button>
          </div>

          <div className="mt-4">
            <StatusBox message={status} tone={tone} />
          </div>

          <p className="mt-5 text-center text-sm text-muted">
            New here?{" "}
            <Link
              className="font-semibold text-brand-700 hover:underline"
              href="/register"
            >
              Create an account
            </Link>
          </p>
        </Card>
      </div>
    </AuthShell>
  );
}

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
