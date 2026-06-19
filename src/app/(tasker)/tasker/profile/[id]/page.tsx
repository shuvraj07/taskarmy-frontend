"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flag,
  Gavel,
  LucideIcon,
  MapPin,
  Shield,
  Star,
  ThumbsUp,
  TrendingUp,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";

// ── Palette matches Taskzity brand ──────────────────────────────────────────
const C = {
  bg: "#f8f6ff",
  card: "#ffffff",
  border: "#ded7ee",
  purple: "#4f22bd",
  purpleDark: "#21145f",
  purpleLight: "#f4efff",
  purpleMid: "#786fa0",
  purpleSoft: "#6d668a",
  green: "#059669",
  greenBg: "#ecfdf5",
  greenBorder: "#a7f3d0",
  amber: "#d97706",
  amberBg: "#fffbeb",
  amberBorder: "#fde68a",
  red: "#dc2626",
  redBg: "#fef2f2",
  redBorder: "#fecaca",
} as const;

// ── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = "completed" | "cancelled" | "disputed";
type TabKey = "overview" | "tasks" | "reviews";

interface ClientBadge {
  label: string;
  icon: LucideIcon;
  color: string;
}

interface RecentTask {
  id: number;
  title: string;
  budget: number;
  status: TaskStatus;
  workerRating: number | null;
  category: string;
}

interface WorkerReview {
  id: number;
  worker: string;
  avatar: string;
  rating: number;
  text: string;
  taskTitle: string;
  date: string;
}

interface ClientData {
  name: string;
  email: string;
  location: string;
  memberSince: string;
  avatar: string;
  verified: boolean;
  role: string;
  bio: string;
  stats: {
    totalTasksPosted: number;
    completedTasks: number;
    cancelledTasks: number;
    disputedTasks: number;
    totalSpent: number;
    avgBudget: number;
    successRate: number;
    repeatWorkers: number;
    avgReleaseHours: number;
  };
  ratings: {
    overall: number;
    clarity: number;
    fairness: number;
    paymentSpeed: number;
    totalReviews: number;
  };
  badges: ClientBadge[];
  recentTasks: RecentTask[];
  workerReviews: WorkerReview[];
}

interface TrustStyle {
  label: string;
  color: string;
  bg: string;
  border: string;
}

interface StatusStyle {
  color: string;
  bg: string;
  border: string;
  icon: LucideIcon;
  label: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK: ClientData = {
  name: "CurrentAI",
  email: "currentai@taskzity.com",
  location: "Kathmandu, Nepal",
  memberSince: "Jan 2025",
  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  verified: true,
  role: "Client",
  bio: "Digital marketing agency posting tasks for content, design, and data work. We pay fast and brief clearly.",
  stats: {
    totalTasksPosted: 24,
    completedTasks: 21,
    cancelledTasks: 1,
    disputedTasks: 2,
    totalSpent: 18400,
    avgBudget: 767,
    successRate: 87.5,
    repeatWorkers: 8,
    avgReleaseHours: 14,
  },
  ratings: {
    overall: 4.9,
    clarity: 4.8,
    fairness: 4.9,
    paymentSpeed: 5.0,
    totalReviews: 19,
  },
  badges: [
    { label: "Fast Payer", icon: Zap, color: C.amber },
    { label: "Clear Brief", icon: BadgeCheck, color: C.green },
    { label: "Verified", icon: Shield, color: C.purple },
    { label: "Top Client", icon: Award, color: C.amber },
  ],
  recentTasks: [
    {
      id: 12,
      title: "Write 5 product descriptions",
      budget: 500,
      status: "completed",
      workerRating: 5,
      category: "Content Writing",
    },
    {
      id: 11,
      title: "Design 3 Instagram banners",
      budget: 800,
      status: "completed",
      workerRating: 4,
      category: "Design",
    },
    {
      id: 10,
      title: "Scrape 200 product prices",
      budget: 600,
      status: "completed",
      workerRating: 5,
      category: "Data Entry",
    },
    {
      id: 9,
      title: "Write 10 Facebook captions",
      budget: 400,
      status: "cancelled",
      workerRating: null,
      category: "Media & Social",
    },
    {
      id: 8,
      title: "Create logo variants",
      budget: 1200,
      status: "completed",
      workerRating: 5,
      category: "Design",
    },
  ],
  workerReviews: [
    {
      id: 1,
      worker: "Shuvaraj B.",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
      rating: 5,
      text: "Brief was crystal clear. Payment released within hours of acceptance.",
      taskTitle: "Write 5 product descriptions",
      date: "May 27, 2026",
    },
    {
      id: 2,
      worker: "Priya S.",
      avatar: "https://randomuser.me/api/portraits/women/22.jpg",
      rating: 5,
      text: "Very professional. Knew exactly what they wanted. Highly recommend.",
      taskTitle: "Design 3 Instagram banners",
      date: "May 20, 2026",
    },
    {
      id: 3,
      worker: "Ramesh K.",
      avatar: "https://randomuser.me/api/portraits/men/67.jpg",
      rating: 4,
      text: "Good task, clear instructions. Revision request was fair.",
      taskTitle: "Scrape 200 product prices",
      date: "May 14, 2026",
    },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function trustLabel(rate: number): TrustStyle {
  if (rate >= 90)
    return {
      label: "Excellent",
      color: C.green,
      bg: C.greenBg,
      border: C.greenBorder,
    };
  if (rate >= 75)
    return {
      label: "Good",
      color: C.amber,
      bg: C.amberBg,
      border: C.amberBorder,
    };
  return { label: "Caution", color: C.red, bg: C.redBg, border: C.redBorder };
}

const STATUS_STYLE: Record<TaskStatus, StatusStyle> = {
  completed: {
    color: C.green,
    bg: C.greenBg,
    border: C.greenBorder,
    icon: CheckCircle2,
    label: "Completed",
  },
  cancelled: {
    color: C.red,
    bg: C.redBg,
    border: C.redBorder,
    icon: XCircle,
    label: "Cancelled",
  },
  disputed: {
    color: C.amber,
    bg: C.amberBg,
    border: C.amberBorder,
    icon: Flag,
    label: "Disputed",
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface RingChartProps {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  label: string;
  sublabel?: string;
}

function RingChart({
  pct,
  size = 88,
  stroke = 8,
  color = C.purple,
  label,
  sublabel,
}: RingChartProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.border}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 900,
            color: C.purpleDark,
            lineHeight: 1,
          }}
        >
          {label}
        </span>
        {sublabel && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: C.purpleSoft,
              marginTop: 2,
              letterSpacing: "0.05em",
            }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

interface StarRowProps {
  rating: number;
  max?: number;
  size?: number;
}

function StarRow({ rating, max = 5, size = 14 }: StarRowProps) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < Math.round(rating) ? C.amber : "none"}
          stroke={i < Math.round(rating) ? C.amber : C.border}
        />
      ))}
    </span>
  );
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = C.purple,
}: StatCardProps) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        boxShadow: "0 2px 12px rgba(41,24,79,0.07)",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: C.purpleLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: C.purpleDark,
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.purpleSoft,
            marginTop: 2,
          }}
        >
          {label}
        </div>
        {sub && (
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: C.purpleMid,
              marginTop: 1,
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

interface RatingBarProps {
  label: string;
  value: number;
}

function RatingBar({ label, value }: RatingBarProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: C.purpleSoft,
          width: 110,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 6,
          background: C.border,
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${(value / 5) * 100}%`,
            height: "100%",
            background: C.purple,
            borderRadius: 99,
            transition: "width 1s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: C.purpleDark,
          width: 28,
          textAlign: "right",
        }}
      >
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ClientPublicProfile() {
  const [tab, setTab] = useState<TabKey>("overview");
  const router = useRouter();
  const searchParams = useSearchParams();
  const trust = trustLabel(MOCK.stats.successRate);
  const p: ClientData = {
    ...MOCK,
    name: searchParams.get("name") || MOCK.name,
    email: searchParams.get("email") || MOCK.email,
    avatar: searchParams.get("avatar") || MOCK.avatar,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          background:
            "linear-gradient(135deg, #5b35c8 0%, #4c24b7 60%, #371184 100%)",
          padding: "20px 16px 28px",
          color: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 800 }}>Client Profile</span>
        </div>

        {/* Profile card */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img
              src={p.avatar}
              alt={p.name}
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                border: "3px solid rgba(255,255,255,0.4)",
                objectFit: "cover",
              }}
            />
            {p.verified && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  background: C.green,
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #fff",
                }}
              >
                <BadgeCheck size={11} color="#fff" />
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>
                {p.name}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 99,
                  padding: "3px 10px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {p.role}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 6,
                opacity: 0.8,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <MapPin size={12} />
              {p.location}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 3,
                opacity: 0.7,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <Calendar size={11} />
              Member since {p.memberSince}
            </div>
            {/* Trust pill */}
            <div
              style={{
                marginTop: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: trust.bg,
                border: `1px solid ${trust.border}`,
                borderRadius: 99,
                padding: "4px 12px",
              }}
            >
              <TrendingUp size={11} color={trust.color} />
              <span
                style={{ fontSize: 11, fontWeight: 800, color: trust.color }}
              >
                {trust.label} Client · {p.stats.successRate}% success
              </span>
            </div>
          </div>
        </div>

        {/* Badge row */}
        <div
          style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}
        >
          {p.badges.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: 99,
                  padding: "5px 12px",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <Icon size={12} color="#fff" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
                  {b.label}
                </span>
              </div>
            );
          })}
        </div>
      </header>

      {/* ── Tabs ── */}
      <div
        style={{
          background: C.card,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          overflowX: "auto",
        }}
      >
        {(["overview", "tasks", "reviews"] as TabKey[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              minWidth: 90,
              padding: "14px 8px",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 800,
              color: tab === t ? C.purple : C.purpleSoft,
              background: "none",
              borderBottom:
                tab === t ? `3px solid ${C.purple}` : "3px solid transparent",
              textTransform: "capitalize",
              letterSpacing: "0.03em",
              transition: "color 0.2s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <main
        style={{
          padding: "16px",
          maxWidth: 640,
          margin: "0 auto",
          paddingBottom: 40,
        }}
      >
        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Bio */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: 16,
                boxShadow: "0 2px 12px rgba(41,24,79,0.07)",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.purpleSoft,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {p.bio}
              </p>
            </div>

            {/* Trust Score */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: 16,
                boxShadow: "0 2px 12px rgba(41,24,79,0.07)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: C.purpleMid,
                  margin: "0 0 14px",
                }}
              >
                Trust Score
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <RingChart
                  pct={p.stats.successRate}
                  label={`${p.stats.successRate}%`}
                  sublabel="SUCCESS"
                  color={C.green}
                  size={96}
                  stroke={9}
                />
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <RatingBar label="Brief Clarity" value={p.ratings.clarity} />
                  <RatingBar label="Fairness" value={p.ratings.fairness} />
                  <RatingBar
                    label="Payment Speed"
                    value={p.ratings.paymentSpeed}
                  />
                </div>
              </div>
              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: C.greenBg,
                  border: `1px solid ${C.greenBorder}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                }}
              >
                <Clock size={14} color={C.green} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>
                  Avg. fund release: <strong>{p.stats.avgReleaseHours}h</strong>{" "}
                  after acceptance
                </span>
              </div>
            </div>

            {/* Stats grid */}
            <p
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: C.purpleMid,
                margin: "4px 0 0",
              }}
            >
              Activity
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <StatCard
                icon={Briefcase}
                label="Tasks Posted"
                value={p.stats.totalTasksPosted}
                sub={`${p.stats.completedTasks} completed`}
              />
              <StatCard
                icon={Wallet}
                label="Total Spent"
                value={`Rs ${p.stats.totalSpent.toLocaleString()}`}
                sub={`Avg Rs ${p.stats.avgBudget}/task`}
              />
              <StatCard
                icon={ThumbsUp}
                label="Repeat Workers"
                value={p.stats.repeatWorkers}
                sub="workers hired again"
                color={C.green}
              />
              <StatCard
                icon={Gavel}
                label="Disputes"
                value={p.stats.disputedTasks}
                sub={`${p.stats.cancelledTasks} cancelled`}
                color={p.stats.disputedTasks > 2 ? C.red : C.amber}
              />
            </div>

            {/* Overall rating */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 16,
                boxShadow: "0 2px 12px rgba(41,24,79,0.07)",
              }}
            >
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: 900,
                    color: C.purpleDark,
                    lineHeight: 1,
                  }}
                >
                  {p.ratings.overall}
                </div>
                <StarRow rating={p.ratings.overall} size={16} />
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.purpleSoft,
                    marginTop: 4,
                  }}
                >
                  {p.ratings.totalReviews} reviews
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  borderLeft: `1px solid ${C.border}`,
                  paddingLeft: 16,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.purpleSoft,
                    margin: "0 0 6px",
                  }}
                >
                  What workers say
                </p>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.purpleDark,
                    margin: 0,
                    lineHeight: 1.5,
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;Clear briefs, fast payment, fair on revisions.&rdquo;
                </p>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.purpleMid,
                    margin: "4px 0 0",
                  }}
                >
                  — Most common feedback
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── TASKS TAB ── */}
        {tab === "tasks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: C.purpleMid,
                margin: "4px 0 8px",
              }}
            >
              Recent Tasks
            </p>
            {p.recentTasks.map((task) => {
              const s: StatusStyle =
                STATUS_STYLE[task.status] ?? STATUS_STYLE.completed;
              const StatusIcon = s.icon;
              return (
                <div
                  key={task.id}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    boxShadow: "0 2px 10px rgba(41,24,79,0.06)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: C.purpleDark,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {task.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 5,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: C.purpleSoft,
                        }}
                      >
                        {task.category}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: C.purple,
                        }}
                      >
                        Rs {task.budget}
                      </span>
                      {task.workerRating !== null && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <Star size={11} fill={C.amber} stroke={C.amber} />
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: C.amber,
                            }}
                          >
                            {task.workerRating}.0 given
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: s.bg,
                      border: `1px solid ${s.border}`,
                      borderRadius: 99,
                      padding: "4px 10px",
                      flexShrink: 0,
                    }}
                  >
                    <StatusIcon size={11} color={s.color} />
                    <span
                      style={{ fontSize: 11, fontWeight: 700, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── REVIEWS TAB ── */}
        {tab === "reviews" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: C.purpleMid,
                margin: "4px 0 8px",
              }}
            >
              Worker Reviews
            </p>
            {p.workerReviews.map((review) => (
              <div
                key={review.id}
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: 16,
                  boxShadow: "0 2px 12px rgba(41,24,79,0.07)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <img
                    src={review.avatar}
                    alt={review.worker}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: `2px solid ${C.border}`,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: C.purpleDark,
                      }}
                    >
                      {review.worker}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: C.purpleSoft,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {review.taskTitle}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 3,
                      flexShrink: 0,
                    }}
                  >
                    <StarRow rating={review.rating} size={13} />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: C.purpleMid,
                      }}
                    >
                      {review.date}
                    </span>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.purpleDark,
                    margin: 0,
                    lineHeight: 1.55,
                    fontStyle: "italic",
                    borderLeft: `3px solid ${C.purple}`,
                    paddingLeft: 10,
                  }}
                >
                  &ldquo;{review.text}&rdquo;
                </p>
              </div>
            ))}

            {/* Leave review CTA */}
            <button
              type="button"
              style={{
                width: "100%",
                padding: "14px",
                background: C.purple,
                border: "none",
                borderRadius: 12,
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 4,
              }}
            >
              <Star size={16} fill="#fff" stroke="#fff" />
              Leave a Review
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
