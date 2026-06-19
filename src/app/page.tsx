"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Briefcase, Users, Zap } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { readActiveRole } from "@/lib/session-store";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const role = readActiveRole();
    setIsLoggedIn(!!role);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#f8f6ff] to-white">
      {/* Header */}
      <header className="border-b border-[#ded7ee] bg-white px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4f22bd] text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="text-2xl font-bold text-[#21145f]">Taskzity</p>
            </div>
            <nav className="flex items-center gap-4">
              {isLoggedIn ? (
                <Button onClick={() => router.push("/bids")}>Dashboard</Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/login")}
                  >
                    Sign In
                  </Button>
                  <Button onClick={() => router.push("/register")}>
                    Get Started
                  </Button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold text-[#21145f]">
            Get Tasks Done — Remotely
          </h1>
          <p className="mt-4 text-xl text-[#6d668a]">
            Post tasks, find skilled workers, and get things done faster.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            {!isLoggedIn && (
              <>
                <Button
                  size="lg"
                  onClick={() => router.push("/register?role=client")}
                >
                  Post a Task
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/register?role=tasker")}
                >
                  Find Work
                </Button>
              </>
            )}
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/bids")}
            >
              Browse Tasks
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-[#21145f]">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-[#ded7ee] bg-white p-6">
              <Briefcase className="h-8 w-8 text-[#4f22bd]" />
              <h3 className="mt-4 text-xl font-bold text-[#21145f]">
                Post a Task
              </h3>
              <p className="mt-2 text-[#6d668a]">
                Describe what you need done and set your budget
              </p>
            </Card>
            <Card className="border-[#ded7ee] bg-white p-6">
              <Users className="h-8 w-8 text-[#4f22bd]" />
              <h3 className="mt-4 text-xl font-bold text-[#21145f]">
                Get Offers
              </h3>
              <p className="mt-2 text-[#6d668a]">
                Receive bids from qualified workers instantly
              </p>
            </Card>
            <Card className="border-[#ded7ee] bg-white p-6">
              <Zap className="h-8 w-8 text-[#4f22bd]" />
              <h3 className="mt-4 text-xl font-bold text-[#21145f]">
                Get It Done
              </h3>
              <p className="mt-2 text-[#6d668a]">
                Collaborate and complete your task on time
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#4f22bd] to-[#371184] px-6 py-16 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-4 text-white/80">
            Browse available tasks or post your own.
          </p>
          {!isLoggedIn && (
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="bg-white text-[#4f22bd]">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="border-white">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
          {isLoggedIn && (
            <Button
              size="lg"
              className="mt-8 bg-white text-[#4f22bd]"
              onClick={() => router.push("/bids")}
            >
              Go to Dashboard
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
