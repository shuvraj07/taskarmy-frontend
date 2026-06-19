"use client";

import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-brand-900">
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/login" className="flex items-center gap-3 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-brand-700">
              <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-base font-semibold">Taskzity</span>
          </Link>
          <div className="flex gap-2">
            <Link
              className="rounded-md px-3 py-2 text-sm font-semibold text-brand-100 hover:bg-white/10"
              href="/login"
            >
              Login
            </Link>
            <Link
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-brand-700"
              href="/register"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
