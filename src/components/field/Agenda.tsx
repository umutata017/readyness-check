import { Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, MapPin, User } from "lucide-react";
import { jobCode, technicianName, type Job } from "@/data/jobs";
import {
  addDays,
  findOverlaps,
  formatClock,
  formatLongDay,
  formatWeekRange,
  isSameDay,
  jobsOnDay,
  startOfWeek,
  weekDays,
} from "@/data/planning";
import type { DisplayStatus } from "@/data/store";
import { cn } from "@/lib/utils";
import { FieldButton } from "./FieldButton";
import { statusLabel, statusStyle } from "./JobCard";

type DetailPath = "/job/$jobId" | "/supervisor/job/$jobId";

/**
 * Week agenda: Monday to Sunday, each day listing its jobs in time order.
 * The supervisor version also names the technician and flags double bookings.
 */
export function Agenda({
  jobs,
  weekStart,
  onWeekChange,
  statusOf,
  detailPath,
  supervisor = false,
}: {
  jobs: Job[];
  weekStart: Date;
  onWeekChange: (weekStart: Date) => void;
  statusOf: (job: Job) => DisplayStatus;
  detailPath: DetailPath;
  supervisor?: boolean;
}) {
  const today = new Date();
  const thisWeek = startOfWeek(today);
  const overlaps = supervisor ? findOverlaps(jobs) : new Map<string, Job[]>();
  const unplanned = jobs.filter((job) => !job.schedule);
  const plannedThisWeek = weekDays(weekStart).reduce(
    (count, day) => count + jobsOnDay(jobs, day).length,
    0,
  );

  return (
    <div className="space-y-5">
      <nav aria-label="Choose week" className="space-y-3">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <FieldButton
            variant="tile"
            aria-label="Previous week"
            className="min-h-tap w-tap p-0"
            onClick={() => onWeekChange(addDays(weekStart, -7))}
          >
            <ChevronLeft className="size-6" />
          </FieldButton>
          <div className="text-center">
            <p className="font-display text-xl leading-tight">{formatWeekRange(weekStart)}</p>
            <p className="text-sm font-semibold text-muted-foreground">
              {plannedThisWeek === 0
                ? "Nothing planned"
                : `${plannedThisWeek} ${plannedThisWeek === 1 ? "job" : "jobs"} planned`}
            </p>
          </div>
          <FieldButton
            variant="tile"
            aria-label="Next week"
            className="min-h-tap w-tap p-0"
            onClick={() => onWeekChange(addDays(weekStart, 7))}
          >
            <ChevronRight className="size-6" />
          </FieldButton>
        </div>
        {weekStart.getTime() !== thisWeek.getTime() && (
          <FieldButton
            variant="tile"
            className="min-h-tap flex-row py-2 text-base"
            onClick={() => onWeekChange(thisWeek)}
          >
            <CalendarDays className="size-5" />
            Back to this week
          </FieldButton>
        )}
      </nav>

      {weekDays(weekStart).map((day) => {
        const dayJobs = jobsOnDay(jobs, day);
        const isToday = isSameDay(day, today);
        return (
          <section key={day.toISOString()} aria-label={formatLongDay(day)} className="space-y-2">
            <h2
              className={cn(
                "flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest",
                isToday ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {formatLongDay(day)}
              {isToday && (
                <span className="rounded-full bg-brand-ink px-2.5 py-0.5 text-xs normal-case tracking-normal text-white">
                  Today
                </span>
              )}
            </h2>
            {dayJobs.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm font-semibold text-muted-foreground">
                No jobs planned
              </p>
            ) : (
              <ol className="space-y-2">
                {dayJobs.map((job) => (
                  <li key={job.id}>
                    <AgendaEntry
                      job={job}
                      status={statusOf(job)}
                      detailPath={detailPath}
                      supervisor={supervisor}
                      clashes={overlaps.get(job.id) ?? []}
                    />
                  </li>
                ))}
              </ol>
            )}
          </section>
        );
      })}

      {unplanned.length > 0 && (
        <section aria-label="Not planned yet" className="space-y-2">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
            Not planned yet
          </h2>
          <ol className="space-y-2">
            {unplanned.map((job) => (
              <li key={job.id}>
                <AgendaEntry
                  job={job}
                  status={statusOf(job)}
                  detailPath={detailPath}
                  supervisor={supervisor}
                  clashes={[]}
                />
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function AgendaEntry({
  job,
  status,
  detailPath,
  supervisor,
  clashes,
}: {
  job: Job;
  status: DisplayStatus;
  detailPath: DetailPath;
  supervisor: boolean;
  clashes: Job[];
}) {
  const cancelled = status === "cancelled";
  return (
    <Link
      to={detailPath}
      params={{ jobId: job.id }}
      className={cn(
        "grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded-2xl border-2 p-4 text-foreground transition hover:border-input",
        cancelled
          ? "border-cancel-border bg-cancel-surface"
          : status === "updated"
            ? "border-change-border bg-change-surface"
            : "border-border bg-card",
      )}
    >
      <div className={cn("font-bold leading-tight", cancelled && "line-through opacity-70")}>
        {job.schedule ? (
          <>
            <p className="text-lg">{formatClock(new Date(job.schedule.start))}</p>
            <p className="text-sm text-muted-foreground">{formatClock(new Date(job.schedule.end))}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{job.timeslot}</p>
        )}
      </div>
      <div className="min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold tracking-wider text-muted-foreground">
              {jobCode(job)}
            </p>
            <p className="break-words text-lg font-bold leading-snug">{job.project}</p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold",
              statusStyle[status],
            )}
          >
            {statusLabel[status]}
          </span>
        </div>
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <MapPin className="size-4 shrink-0" />
          <span className="min-w-0 truncate">{job.address}</span>
        </p>
        {supervisor && (
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <User className="size-4 shrink-0" />
            {technicianName(job.technicianId)}
          </p>
        )}
        {clashes.length > 0 && (
          <p className="flex items-start gap-1.5 rounded-xl border border-change-border bg-change-soft px-2.5 py-1.5 text-sm font-bold text-change-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            Overlaps with {clashes.map((other) => jobCode(other)).join(", ")}
          </p>
        )}
      </div>
    </Link>
  );
}
