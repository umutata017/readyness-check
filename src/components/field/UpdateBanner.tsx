import { Link } from "@tanstack/react-router";
import { BellRing, ChevronRight } from "lucide-react";
import type { Job } from "@/data/jobs";

/** Home-screen banner shown when the selected technician has a job with an unseen update. */
export function UpdateBanner({ job }: { job: Job }) {
  return (
    <Link
      to="/job/$jobId"
      params={{ jobId: job.id }}
      className="flex items-center gap-4 rounded-3xl border-2 border-change-border bg-change-surface p-5 text-foreground transition active:scale-[0.98]"
      aria-live="polite"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-change-soft text-change">
        <BellRing className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold uppercase tracking-widest text-change-foreground">Job updated</span>
        <span className="block truncate text-lg font-bold">{job.project} — tap to see what changed</span>
      </span>
      <ChevronRight className="size-6 shrink-0" />
    </Link>
  );
}
