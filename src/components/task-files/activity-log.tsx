import type { TaskFile } from "@/lib/task-files";
import { Section } from "@/components/task-files/section";

export function ActivityLog({ files }: { files: TaskFile[] }) {
  return (
    <Section title="📋 Activity Log" subtitle="Upload history for this task">
      <div className="space-y-2">
        {files.length === 0 ? (
          <p className="py-4 text-center text-xs font-semibold text-[#786fa0]">
            No activity yet
          </p>
        ) : (
          [...files]
            .sort(
              (a, b) =>
                new Date(b.uploadedAt).getTime() -
                new Date(a.uploadedAt).getTime(),
            )
            .map((f) => (
              <div key={f.id} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#4f22bd]" />
                <p className="break-words text-xs font-semibold text-[#374151]">
                  <span className="font-extrabold">
                    {f.uploadedBy === "client" ? "Client" : "Tasker"}
                  </span>{" "}
                  uploaded{" "}
                  <span className="break-all font-extrabold">{f.name}</span>
                  {" · "}
                  <span className="whitespace-nowrap text-[#9CA3AF]">
                    {f.uploadedAt}
                  </span>
                </p>
              </div>
            ))
        )}
      </div>
    </Section>
  );
}
