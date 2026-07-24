"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { readSessions } from "@/lib/session-store";
import { DashboardOverview } from "@/components/shared/dashboard-overview";

export default function ClientDashboard() {
  const router = useRouter();

  useEffect(() => {
    if (!readSessions().client) {
      router.replace("/login");
    }
  }, [router]);

  return <DashboardOverview />;
}
