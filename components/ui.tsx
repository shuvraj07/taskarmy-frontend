"use client";

import type { ReactNode } from "react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}) {
  const styles = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary:
      "border border-line bg-white text-ink hover:border-brand-500 hover:bg-brand-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline:
      "border border-line bg-white text-ink shadow-sm hover:border-brand-500 hover:bg-paper",
  };

  const sizeStyles = {
    sm: "min-h-9 px-3 text-xs",
    md: "min-h-11 px-4 text-sm",
    lg: "min-h-12 px-6 text-base",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        className="mt-1 min-h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-muted/70"
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <textarea
        className="mt-1 min-h-28 w-full resize-y rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <select
        className="mt-1 min-h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

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

export function StatusBox({
  message,
  tone = "neutral",
}: {
  message: string;
  tone?: "neutral" | "success" | "error";
}) {
  const styles = {
    neutral: "border-line bg-white text-muted",
    success: "border-mint-100 bg-mint-100 text-mint-700",
    error: "border-red-100 bg-red-50 text-red-700",
  };

  return (
    <div
      className={`rounded-md border p-3 text-sm font-medium ${styles[tone]}`}
    >
      {message}
    </div>
  );
}
