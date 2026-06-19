"use client";

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
