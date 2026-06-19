"use client";

import { useEffect } from "react";

// This is the last line of defense — it only activates if the root layout
// itself throws (e.g. a provider crashing during render), which error.tsx
// can't catch since error.tsx renders *inside* the root layout. Next.js
// requires this file to render its own <html>/<body>, and it's kept
// dependency-free (inline styles, no shared components) on purpose: if the
// rest of the app failed to render, this shouldn't be able to fail too.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "#171225" }}>
              Something went wrong
            </h1>
            <p style={{ marginTop: 8, color: "#6b6478", lineHeight: 1.5 }}>
              The application failed to load. Please try again.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: 24,
                padding: "10px 20px",
                borderRadius: 8,
                background: "#6840cf",
                color: "#fff",
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
