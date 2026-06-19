import type { ReactNode } from "react";

export function Section({
  title,
  subtitle,
  children,
  highlight,
  locked,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  highlight?: boolean;
  locked?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-3 shadow-sm sm:p-4 ${
        highlight
          ? "border-[#4f22bd]/40 shadow-[0_0_0_2px_rgba(79,34,189,0.12)]"
          : locked
            ? "border-[#ded7ee] opacity-60"
            : "border-[#ded7ee]"
      }`}
    >
      <div className="mb-3">
        <p className="text-[15px] font-extrabold text-[#21145f] sm:text-base">
          {title}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-[#786fa0]">
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  );
}
