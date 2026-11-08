import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import type { Job } from "@/data/jobs";
import { formatTime } from "@/data/store";

export function JobHistory({ job }: { job: Job }) {
  return <section>
    <h2 className="mb-3 text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Update history</h2>
    <ol className="divide-y divide-border">
      {[...job.history].reverse().map((entry) => <li key={entry.id} className="space-y-2 py-4">
        <div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold">{entry.field} · {entry.kind}</h3><time className="text-sm text-muted-foreground" dateTime={entry.at}>{formatTime(entry.at)}</time></div>
        <div className="flex flex-wrap items-center gap-2 break-words font-semibold">
          {entry.oldValue && <><span className="text-muted-foreground line-through">{entry.oldValue}</span><ArrowRight className="size-4 shrink-0" /></>}
          <span>{entry.newValue}</span>
        </div>
        {entry.message && <p className="text-muted-foreground">“{entry.message}”</p>}
        <p className={`flex items-center gap-2 text-sm font-bold ${entry.seenAt ? "text-success" : "text-muted-foreground"}`}>
          {entry.seenAt ? <CheckCircle2 className="size-4 shrink-0" /> : <Clock className="size-4 shrink-0" />}
          {entry.seenAt ? `Seen by technician · ${formatTime(entry.seenAt)}` : entry.notify ? "Not seen yet" : "Notification off"}
        </p>
      </li>)}
    </ol>
  </section>;
}