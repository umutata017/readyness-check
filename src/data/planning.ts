import type { Job, JobSchedule } from "./jobs";

/** What the job form edits: a calendar date plus start and end times, as the inputs give them. */
export type ScheduleDraft = { date: string; start: string; end: string }; // "2026-11-17", "08:00", "12:30"

const pad = (n: number) => String(n).padStart(2, "0");

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Monday 00:00 of the week that contains `date`. */
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const sinceMonday = (day.getDay() + 6) % 7;
  return addDays(day, -sinceMonday);
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function formatClock(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "Mon 17 Nov" */
export function formatShortDay(date: Date): string {
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/** "Monday 17 November" */
export function formatLongDay(date: Date): string {
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

/** "17 – 23 Nov 2026" or "29 Dec 2026 – 4 Jan 2027" */
export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const sameYear = weekStart.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && weekStart.getMonth() === end.getMonth();
  const startLabel = weekStart.toLocaleDateString("en-GB", {
    day: "numeric",
    ...(sameMonth ? {} : { month: "short" }),
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const endLabel = end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

/** "Today", "Tomorrow", "Yesterday", otherwise "Mon 17 Nov". */
export function relativeDayLabel(date: Date, now = new Date()): string {
  const diff = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return formatShortDay(date);
}

/** "Today · 08:00 – 12:30" — always current, unlike the stored text. */
export function formatSchedule(schedule: JobSchedule, now = new Date()): string {
  const start = new Date(schedule.start);
  const end = new Date(schedule.end);
  return `${relativeDayLabel(start, now)} · ${formatClock(start)} – ${formatClock(end)}`;
}

/** "Mon 17 Nov · 08:00 – 12:30" — the version stored in the database and in history. */
export function formatScheduleAbsolute(schedule: JobSchedule): string {
  const start = new Date(schedule.start);
  const end = new Date(schedule.end);
  return `${formatShortDay(start)} · ${formatClock(start)} – ${formatClock(end)}`;
}

/** The timeslot to show for a job: from its planned times, or its old text if it has none. */
export function jobTimeslot(job: Pick<Job, "schedule" | "timeslot">, now = new Date()): string {
  return job.schedule ? formatSchedule(job.schedule, now) : job.timeslot;
}

export function scheduleDraftFromJob(job: Pick<Job, "schedule">): ScheduleDraft {
  if (!job.schedule) return { date: "", start: "08:00", end: "12:00" };
  const start = new Date(job.schedule.start);
  const end = new Date(job.schedule.end);
  return {
    date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    start: formatClock(start),
    end: formatClock(end),
  };
}

/** Turns the form's date and times into stored timestamps, or explains what is wrong. */
export function scheduleFromDraft(draft: ScheduleDraft): JobSchedule {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) throw new Error("Choose the date of the job.");
  if (!/^\d{2}:\d{2}$/.test(draft.start) || !/^\d{2}:\d{2}$/.test(draft.end)) {
    throw new Error("Choose a start and end time.");
  }
  const start = new Date(`${draft.date}T${draft.start}`);
  const end = new Date(`${draft.date}T${draft.end}`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("The date or time is not valid.");
  }
  if (end <= start) throw new Error("The end time must be after the start time.");
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Jobs planned on this day, earliest first. */
export function jobsOnDay(jobs: Job[], day: Date): Job[] {
  return jobs
    .filter((job) => job.schedule && isSameDay(new Date(job.schedule.start), day))
    .sort((a, b) => a.schedule!.start.localeCompare(b.schedule!.start));
}

/**
 * For each job, the other jobs of the same technician whose times overlap it.
 * Cancelled jobs are ignored: they no longer block the technician's time.
 */
export function findOverlaps(jobs: Job[]): Map<string, Job[]> {
  const planned = jobs.filter((job) => job.schedule && !job.cancellation);
  const overlaps = new Map<string, Job[]>();
  for (const job of planned) {
    const clashes = planned.filter(
      (other) =>
        other.id !== job.id &&
        other.technicianId === job.technicianId &&
        other.schedule!.start < job.schedule!.end &&
        job.schedule!.start < other.schedule!.end,
    );
    if (clashes.length) overlaps.set(job.id, clashes);
  }
  return overlaps;
}
