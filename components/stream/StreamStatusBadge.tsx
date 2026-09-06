import type { StreamStatus } from "@/types";

const STYLES: Record<StreamStatus, { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-accent/10 text-accent border-accent/30" },
  active: { label: "Active", className: "bg-primary/10 text-primary border-primary/30" },
  cliff: { label: "Cliff pending", className: "bg-warning/10 text-warning border-warning/30" },
  cancelled: { label: "Cancelled", className: "bg-danger/10 text-danger border-danger/30" },
  completed: { label: "Completed", className: "bg-muted/10 text-muted border-muted/30" },
};

export function StreamStatusBadge({ status }: { status: StreamStatus }) {
  const style = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.className}`}
    >
      {status === "active" && <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary" />}
      {style.label}
    </span>
  );
}
