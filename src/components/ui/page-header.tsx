"use client";

import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
