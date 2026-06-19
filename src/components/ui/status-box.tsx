"use client";

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
