export function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  // Omit onDismiss for errors that reflect real, ongoing state (e.g. "task
  // not found") — dismissing those wouldn't change the underlying fact, so
  // we don't offer a button that can't actually do anything.
  onDismiss?: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
      ⚠️ {message}
      {onDismiss && (
        <button className="ml-2 underline" onClick={onDismiss}>
          Dismiss
        </button>
      )}
    </div>
  );
}

export function StatusBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
      ✅ {message}
    </div>
  );
}
