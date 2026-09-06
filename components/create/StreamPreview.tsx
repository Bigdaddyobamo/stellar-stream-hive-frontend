"use client";

import { formatDistanceStrict } from "date-fns";
import { formatRate } from "@/lib/format";
import type { TokenInfo } from "@/types";

export interface StreamPreviewProps {
  amount: string;
  token: TokenInfo;
  startDate: Date;
  endDate: Date;
  recipient: string;
}

/** Live-updating summary of what the configured stream will do, before submission. */
export function StreamPreview({ amount, token, startDate, endDate, recipient }: StreamPreviewProps) {
  const totalAmount = Number(amount);
  const durationSeconds = (endDate.getTime() - startDate.getTime()) / 1000;
  const hasValidInputs = Number.isFinite(totalAmount) && totalAmount > 0 && durationSeconds > 0 && token.symbol;

  if (!hasValidInputs) {
    return (
      <div className="card border-dashed text-sm text-muted">
        Fill in a recipient, amount, and schedule to see a live preview of the stream rate.
      </div>
    );
  }

  const ratePerSecond = totalAmount / durationSeconds;
  const rate = formatRate(ratePerSecond, token.symbol);
  const durationLabel = formatDistanceStrict(endDate, startDate);

  return (
    <div className="card border-primary/20 bg-primary/5">
      <p className="text-sm text-muted">This stream will pay</p>
      <p className="mono-tabular mt-1 text-2xl font-bold text-primary">{rate.perDay} / day</p>
      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <RateStat label="Per second" value={rate.perSecond} />
        <RateStat label="Per hour" value={rate.perHour} />
        <RateStat label="Per day" value={rate.perDay} />
      </div>
      <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
        <SummaryRow label="Recipient" value={recipient || "—"} mono />
        <SummaryRow label="Total amount" value={`${totalAmount.toLocaleString()} ${token.symbol}`} />
        <SummaryRow label="Duration" value={durationLabel} />
      </div>
    </div>
  );
}

function RateStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background px-3 py-2">
      <p className="text-muted">{label}</p>
      <p className="mono-tabular mt-0.5 font-medium text-white">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={mono ? "truncate pl-4 font-mono text-xs" : "font-medium"}>{value}</span>
    </div>
  );
}
