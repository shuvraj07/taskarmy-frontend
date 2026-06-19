import { FolderOpen } from "lucide-react";

export function EmptyWaiting({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center py-5 text-center">
      <FolderOpen className="mb-2 h-10 w-10 text-[#ded7ee]" />
      <p className="text-xs font-semibold text-[#9CA3AF]">{text}</p>
    </div>
  );
}

export function LockedMessage({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center py-5 text-center">
      <span className="mb-2 text-3xl">🔒</span>
      <p className="text-xs font-semibold text-[#9CA3AF]">{text}</p>
    </div>
  );
}
