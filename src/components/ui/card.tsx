"use client";

import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface rounded-lg p-5 ${className}`}>
      {children}
    </section>
  );
}
