import { XCircle } from "lucide-react";
import { CANCEL_REASON_LABELS, type Cancellation } from "@/data/jobs";
import { formatTime } from "@/data/store";

/** Light-red notice with the cancellation reason (dark red), shown on cancelled job detail screens. */
export function CancelNotice({ cancellation }: { cancellation: Cancellation }) {
  return (
    <section
      className="rounded-3xl border-2 border-cancel-border bg-cancel-surface p-5 text-cancel-foreground"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <XCircle className="size-6 shrink-0" aria-hidden />
        <h2 className="font-display text-xl">{CANCEL_REASON_LABELS[cancellation.reason]}</h2>
      </div>
      {cancellation.note && <p className="mt-2 text-base font-semibold">“{cancellation.note}”</p>}
      {cancellation.at && (
        <p className="mt-2 text-sm font-bold">Removed {formatTime(cancellation.at)} · Do not start this job</p>
      )}
    </section>
  );
}
