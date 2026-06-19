export function TaskCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-line bg-white p-4">
      <div className="h-4 w-2/3 rounded bg-paper" />
      <div className="mt-3 h-3 w-full rounded bg-paper" />
      <div className="mt-2 h-3 w-5/6 rounded bg-paper" />
      <div className="mt-4 flex gap-2">
        <div className="h-5 w-16 rounded bg-paper" />
        <div className="h-5 w-16 rounded bg-paper" />
      </div>
    </div>
  );
}
