import type { TaskerStep } from "@/hooks/use-tasker-step-machine";

const STEPS: Array<{ key: TaskerStep; label: string }> = [
  { key: "download", label: "Download Brief" },
  { key: "upload", label: "Upload Work" },
  { key: "submitted", label: "Submitted" },
];

export function StepIndicator({ currentStep }: { currentStep: TaskerStep }) {
  const idx = STEPS.findIndex((s) => s.key === currentStep);
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#ded7ee] bg-white px-3 py-3 shadow-sm sm:px-4">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex flex-1 items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold transition-all ${
                i < idx
                  ? "bg-emerald-500 text-white"
                  : i === idx
                    ? "bg-[#4f22bd] text-white shadow-[0_0_0_3px_rgba(79,34,189,0.2)]"
                    : "bg-[#f0ecfa] text-[#786fa0]"
              }`}
            >
              {i < idx ? "✓" : i + 1}
            </div>
            <p
              className={`mt-1 text-[10px] font-extrabold leading-tight ${i === idx ? "text-[#4f22bd]" : "text-[#786fa0]"}`}
            >
              {step.label}
            </p>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`mx-1.5 h-0.5 flex-1 rounded-full transition-all sm:mx-2 ${i < idx ? "bg-emerald-400" : "bg-[#ded7ee]"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
