"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  DoughnutController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  DoughnutController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

// ── types ──────────────────────────────────────────────────────────────────────

type TaskStatus = "done" | "progress" | "pending";

interface Task {
  name: string;
  status: TaskStatus;
}

interface EarningEntry {
  title: string;
  meta: string;
  amount: string;
}

// ── data ───────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: "Design", pct: 94 },
  { label: "Engineering", pct: 88 },
  { label: "Marketing", pct: 76 },
  { label: "Operations", pct: 82 },
];

const TASKS: Task[] = [
  { name: "Brand refresh deck", status: "done" },
  { name: "API integration", status: "progress" },
  { name: "Q2 analytics report", status: "done" },
  { name: "User interview synthesis", status: "pending" },
  { name: "Mobile app QA", status: "progress" },
];

const EARNINGS: EarningEntry[] = [
  { title: "Brand identity", meta: "May 22 · Design", amount: "+$3,200" },
  { title: "Backend API", meta: "May 20 · Engineering", amount: "+$5,800" },
  { title: "Campaign setup", meta: "May 18 · Marketing", amount: "+$1,400" },
  { title: "Sprint planning", meta: "May 15 · Ops", amount: "+$2,100" },
];

// ── palette ────────────────────────────────────────────────────────────────────

const P = {
  50: "#EEEDFE",
  100: "#CECBF6",
  200: "#AFA9EC",
  400: "#7F77DD",
  600: "#534AB7",
  800: "#3C3489",
  900: "#26215C",
};

// ── sub-components ─────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  variant = "light",
}: {
  label: string;
  value: string;
  sub: string;
  variant?: "purple" | "mid" | "deep" | "light";
}) {
  const variants: Record<string, React.CSSProperties> = {
    purple: { background: P[50] },
    mid: { background: P[100] },
    deep: { background: P[200] },
    light: { background: "#f9f9f9", border: "0.5px solid rgba(0,0,0,0.08)" },
  };
  const textColor: Record<string, string> = {
    purple: P[800],
    mid: P[900],
    deep: P[900],
    light: "#111",
  };
  const labelColor: Record<string, string> = {
    purple: P[600],
    mid: P[800],
    deep: P[900],
    light: "#666",
  };
  const subColor: Record<string, string> = {
    purple: P[400],
    mid: P[600],
    deep: P[800],
    light: "#888",
  };

  return (
    <div
      style={{
        ...variants[variant],
        borderRadius: 12,
        padding: "1rem 1.25rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: labelColor[variant],
          marginBottom: 6,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: textColor[variant],
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, color: subColor[variant], marginTop: 6 }}>
        {sub}
      </p>
      <div
        style={{
          position: "absolute",
          right: -12,
          bottom: -12,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: textColor[variant],
          opacity: 0.08,
        }}
      />
    </div>
  );
}

function ProgressBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 5,
          fontSize: 13,
          color: "#111",
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: P[600] }}>{pct}%</span>
      </div>
      <div
        style={{
          background: P[50],
          borderRadius: 99,
          height: 6,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 99,
            background: `linear-gradient(90deg, ${P[400]}, ${P[600]})`,
          }}
        />
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const dot: Record<TaskStatus, React.CSSProperties> = {
    done: { background: P[600] },
    progress: { background: P[200] },
    pending: { background: P[100], border: `1.5px solid ${P[200]}` },
  };
  const badge: Record<TaskStatus, React.CSSProperties> = {
    done: { background: P[50], color: P[600] },
    progress: { background: P[100], color: P[800] },
    pending: { background: "#f0f0f0", color: "#888" },
  };
  const labels: Record<TaskStatus, string> = {
    done: "Done",
    progress: "In progress",
    pending: "Pending",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
        borderBottom: "0.5px solid rgba(0,0,0,0.07)",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          flexShrink: 0,
          ...dot[task.status],
        }}
      />
      <span style={{ flex: 1, fontSize: 13, color: "#111" }}>{task.name}</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          padding: "2px 10px",
          borderRadius: 99,
          ...badge[task.status],
        }}
      >
        {labels[task.status]}
      </span>
    </div>
  );
}

function ActivityRow({ entry }: { entry: EarningEntry }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "0.5px solid rgba(0,0,0,0.07)",
        fontSize: 13,
      }}
    >
      <div>
        <p style={{ color: "#111", margin: 0 }}>{entry.title}</p>
        <p style={{ color: "#888", fontSize: 12, margin: 0 }}>{entry.meta}</p>
      </div>
      <span style={{ fontWeight: 600, color: P[600] }}>{entry.amount}</span>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid rgba(0,0,0,0.08)",
        borderRadius: 12,
        padding: "1rem 1.25rem",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#888",
          marginBottom: 16,
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

// Identical mock analytics view shared by client/dashboard, tasker/dashboard,
// and (currently) client/tasks — no role-specific data, so it takes no props.
// Each page owns its own auth guard around this.
export function DashboardOverview() {
  const donutRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);
  const donutChart = useRef<Chart | null>(null);
  const barChart = useRef<Chart | null>(null);

  useEffect(() => {
    if (donutRef.current) {
      donutChart.current?.destroy();
      donutChart.current = new Chart(donutRef.current, {
        type: "doughnut",
        data: {
          labels: ["Completed", "In progress", "Pending"],
          datasets: [
            {
              data: [62, 24, 14],
              backgroundColor: [P[600], P[200], P[50]],
              borderColor: [P[600], P[200], P[100]],
              borderWidth: 1.5,
              hoverOffset: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "72%",
          plugins: { legend: { display: false } },
        },
      });
    }

    if (barRef.current) {
      barChart.current?.destroy();
      barChart.current = new Chart(barRef.current, {
        type: "bar",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May"],
          datasets: [
            {
              label: "Earnings ($k)",
              data: [14, 17, 19, 22, 24.6],
              backgroundColor: [P[100], P[200], P[400], P[600], P[800]],
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: P[400], font: { size: 12 } },
            },
            y: {
              grid: { color: "rgba(175,169,236,0.15)" },
              ticks: {
                color: P[400],
                font: { size: 12 },
                callback: (v) => `$${v}k`,
              },
            },
          },
        },
      });
    }

    return () => {
      donutChart.current?.destroy();
      barChart.current?.destroy();
    };
  }, []);

  const col2: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: 16,
  };

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "1.5rem 1rem",
        maxWidth: 900,
        margin: "0 auto",
        background: "#f4f3fb",
        minHeight: "100vh",
      }}
    >
      {/* top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 600, color: P[900] }}>
          Dashboard
        </h1>
        <span
          style={{
            fontSize: 12,
            color: "#666",
            background: "#fff",
            border: "0.5px solid rgba(0,0,0,0.08)",
            borderRadius: 8,
            padding: "6px 12px",
          }}
        >
          May 2026
        </span>
      </div>

      {/* KPI row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <KpiCard
          label="Tasks done"
          value="248"
          sub="↑ +12 this week"
          variant="purple"
        />
        <KpiCard
          label="Success rate"
          value="87%"
          sub="↑ +3.2% vs last mo"
          variant="mid"
        />
        <KpiCard
          label="Earnings"
          value="$24.6k"
          sub="↑ +$2.1k"
          variant="deep"
        />
        <KpiCard
          label="Active tasks"
          value="34"
          sub="6 due today"
          variant="light"
        />
      </div>

      {/* row 2 */}
      <div style={col2}>
        <Card title="Success rate by category">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {CATEGORIES.map((c) => (
              <ProgressBar key={c.label} label={c.label} pct={c.pct} />
            ))}
          </div>
        </Card>

        <Card title="Task breakdown">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                position: "relative",
                width: 110,
                height: 110,
                flexShrink: 0,
              }}
            >
              <canvas ref={donutRef} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 600, color: P[800] }}>
                  87%
                </span>
                <span style={{ fontSize: 10, color: P[400] }}>success</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { color: P[600], label: "Completed 62%" },
                { color: P[200], label: "In progress 24%" },
                {
                  color: P[50],
                  label: "Pending 14%",
                  border: `1px solid ${P[100]}`,
                },
              ].map((l) => (
                <div
                  key={l.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    color: "#555",
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: l.color,
                      border: l.border,
                      flexShrink: 0,
                    }}
                  />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* row 3 */}
      <div style={{ ...col2 }}>
        <Card title="Recent tasks">
          <div>
            {TASKS.map((t) => (
              <TaskRow key={t.name} task={t} />
            ))}
          </div>
        </Card>

        <Card title="Earnings activity">
          <div>
            {EARNINGS.map((e) => (
              <ActivityRow key={e.title} entry={e} />
            ))}
          </div>
        </Card>
      </div>

      {/* bar chart */}
      <Card title="Monthly earnings">
        <div style={{ position: "relative", width: "100%", height: 200 }}>
          <canvas ref={barRef} />
        </div>
      </Card>
    </div>
  );
}
