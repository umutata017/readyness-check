import { Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronRight, Clock, MapPin, User } from "lucide-react";
import type { Job } from "@/data/jobs";
import { cn } from "@/lib/utils";

export type DisplayStatus = "updated" | "not-started" | "ready" | "done";

const statusLabel: Record<DisplayStatus, string> = {
  updated: "Updated",
  "not-started": "Not started",
  ready: "Ready",
  done: "Done",
};

const statusStyle: Record<DisplayStatus, string> = {
  updated: "bg-change text-change-foreground",
  "not-started": "bg-secondary text-secondary-foreground",
  ready: "bg-success text-success-foreground",
  done: "bg-muted text-muted-foreground",
};

export function JobCard({ job, status, detailPath = "/job/$jobId" }: { job: Job; status: DisplayStatus; detailPath?: "/job/$jobId" | "/supervisor/job/$jobId" }) {
  const updated = status === "updated";
  return (
    <Link
      to={detailPath}
      params={{ jobId: job.id }}
      className={cn(
        "block rounded-3xl bg-card p-5 transition active:scale-[0.98]",
        updated && "border-2 border-change bg-change-surface",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-xl leading-tight">{job.project}</h2>
        <span className={cn("flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-sm font-bold", statusStyle[status])}>
          {updated && <AlertTriangle className="size-4" aria-hidden />}
          {statusLabel[status]}
        </span>
      </div>
      <div className="mt-3 space-y-1.5 text-base">
        <p className="flex items-center gap-2 font-semibold"><User className="size-4 shrink-0 text-primary" />{job.customer}</p>
        <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-4 shrink-0 text-primary" />{job.address}</p>
        <p className="flex items-center gap-2 font-bold text-primary"><Clock className="size-4 shrink-0" />{job.timeslot}</p>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-sm font-bold text-muted-foreground">
        Open job <ChevronRight className="size-4" />
      </div>
    </Link>
  );
}
