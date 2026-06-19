const ICONS: Record<string, string> = {
  pdf: "📄",
  xlsx: "📊",
  xls: "📊",
  doc: "📝",
  docx: "📝",
  png: "🖼️",
  jpg: "🖼️",
  jpeg: "🖼️",
  webp: "🖼️",
  zip: "🗜️",
  csv: "📋",
};

export function fileIcon(ext: string): string {
  return ICONS[ext] ?? "📁";
}

const COLORS: Record<string, string> = {
  pdf: "#EF4444",
  xlsx: "#22C55E",
  xls: "#22C55E",
  doc: "#3B82F6",
  docx: "#3B82F6",
  png: "#A855F7",
  jpg: "#A855F7",
  jpeg: "#A855F7",
  webp: "#A855F7",
  zip: "#F59E0B",
  csv: "#14B8A6",
};

export function extColor(ext: string): string {
  return COLORS[ext] ?? "#6B7280";
}
