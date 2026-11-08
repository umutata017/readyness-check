// Single access layer for job data. All screens read and write through these
// functions; swapping the dummy data for Supabase later means rewriting only
// this file and the provider in src/state/technician.tsx.
import { technicianName, type ItemKind, type Job, type UpdateEntry } from "./jobs";

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

/** Updates the technician has not tapped "Seen" on yet. */
export function openEntries(job: Job): UpdateEntry[] {
  return job.history.filter((e) => e.notify && !e.seenAt);
}

export function latestOpenEntry(job: Job): UpdateEntry | undefined {
  return openEntries(job).at(-1);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function nextJobId(jobs: Job[]): string {
  const max = jobs.reduce((m, j) => {
    const n = Number.parseInt(j.id.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `J-${max + 1}`;
}

export type NewJobInput = {
  project: string;
  customer: string;
  address: string;
  timeslot: string;
  jobType: string;
  technicianId: string;
  tasks: string[];
  items: { label: string; kind: ItemKind }[];
  workspaceAvailable: boolean;
};

export function createJob(jobs: Job[], input: NewJobInput, at = new Date().toISOString()): Job[] {
  const job: Job = {
    id: nextJobId(jobs),
    technicianId: input.technicianId,
    project: input.project,
    customer: input.customer,
    address: input.address,
    timeslot: input.timeslot,
    jobType: input.jobType,
    status: "not-started",
    tasks: input.tasks.filter(Boolean).map((label, i) => ({ id: `t${i + 1}`, label })),
    items: input.items.filter((it) => it.label).map((it, i) => ({ id: `i${i + 1}`, label: it.label, kind: it.kind })),
    workspaceAvailable: input.workspaceAvailable,
    history: [
      {
        id: uid("u"),
        at,
        kind: "created",
        field: "Job",
        oldValue: "",
        newValue: input.project,
        notify: true,
      },
    ],
  };
  return [...jobs, job];
}

export type JobChanges = {
  project?: string;
  customer?: string;
  address?: string;
  timeslot?: string;
  jobType?: string;
  workspaceAvailable?: boolean;
  tasks?: string[];
  items?: { label: string; kind: ItemKind }[];
};

const FIELD_LABELS = {
  project: "Project",
  customer: "Customer",
  address: "Address",
  timeslot: "Timeslot",
  jobType: "Job type",
} as const;

function yn(v: boolean): string {
  return v ? "Available" : "Not available";
}

export function editJob(
  jobs: Job[],
  id: string,
  changes: JobChanges,
  opts: { message?: string; notify: boolean },
  at = new Date().toISOString(),
): Job[] {
  return jobs.map((job) => {
    if (job.id !== id) return job;
    const entries: UpdateEntry[] = [];
    const next: Job = { ...job };
    const base = { kind: "edited" as const, message: opts.message || undefined, notify: opts.notify };

    for (const key of ["project", "customer", "address", "timeslot", "jobType"] as const) {
      const value = changes[key];
      if (value !== undefined && value !== job[key]) {
        entries.push({ id: uid("u"), at, ...base, field: FIELD_LABELS[key], oldValue: job[key], newValue: value });
        next[key] = value;
      }
    }
    if (changes.workspaceAvailable !== undefined && changes.workspaceAvailable !== job.workspaceAvailable) {
      entries.push({ id: uid("u"), at, ...base, field: "Workspace", oldValue: yn(job.workspaceAvailable), newValue: yn(changes.workspaceAvailable) });
      next.workspaceAvailable = changes.workspaceAvailable;
    }
    if (changes.tasks) {
      const oldLabels = job.tasks.map((t) => t.label).join("; ");
      const newLabels = changes.tasks.filter(Boolean).join("; ");
      if (oldLabels !== newLabels) {
        next.tasks = changes.tasks.filter(Boolean).map((label, i) => ({ id: `t${i + 1}`, label }));
        const count = Math.max(job.tasks.length, next.tasks.length);
        for (let i = 0; i < count; i += 1) {
          const oldTask = job.tasks[i];
          const newTask = next.tasks[i];
          if (oldTask?.label !== newTask?.label) {
            entries.push({ id: uid("u"), at, ...base, field: "Task", oldValue: oldTask?.label ?? "", newValue: newTask?.label ?? "Removed", taskId: newTask?.id });
          }
        }
      }
    }
    if (changes.items) {
      const oldLabels = job.items.map((it) => `${it.label} (${it.kind})`).join("; ");
      const newLabels = changes.items.filter((it) => it.label).map((it) => `${it.label} (${it.kind})`).join("; ");
      if (oldLabels !== newLabels) {
        entries.push({ id: uid("u"), at, ...base, field: "Required items", oldValue: oldLabels, newValue: newLabels });
        next.items = changes.items.filter((it) => it.label).map((it, i) => ({ id: `i${i + 1}`, label: it.label, kind: it.kind }));
      }
    }
    return { ...next, history: [...job.history, ...entries] };
  });
}

export function reassignJob(
  jobs: Job[],
  id: string,
  technicianId: string,
  opts: { message?: string; notify: boolean },
  at = new Date().toISOString(),
): Job[] {
  return jobs.map((job) =>
    job.id !== id || job.technicianId === technicianId
      ? job
      : {
          ...job,
          technicianId,
          history: [
            ...job.history,
            {
              id: uid("u"),
              at,
              kind: "reassigned",
              field: "Assigned technician",
              oldValue: technicianName(job.technicianId),
              newValue: technicianName(technicianId),
              message: opts.message || undefined,
              notify: opts.notify,
            },
          ],
        },
  );
}

/** Stamps seenAt on every open entry, so the supervisor sees when it was read. */
export function markJobUpdatesSeen(jobs: Job[], id: string, at = new Date().toISOString()): Job[] {
  return jobs.map((job) =>
    job.id !== id
      ? job
      : { ...job, history: job.history.map((e) => (e.notify && !e.seenAt ? { ...e, seenAt: at } : e)) },
  );
}
