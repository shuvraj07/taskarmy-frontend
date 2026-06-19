"use client";

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
