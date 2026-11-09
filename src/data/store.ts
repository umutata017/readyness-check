import { supabase } from "@/lib/supabase";
import { technicianName, type ItemKind, type Job, type UpdateEntry } from "./jobs";

type JobRow = {
  id: string;
  technician_id: string;
  project: string;
  customer: string;
  address: string;
  timeslot: string;
  job_type: string;
  status: Job["status"];
  workspace_available: boolean;
};

type TaskRow = { id: string; job_id: string; label: string; position: number };
type ItemRow = {
  id: string;
  job_id: string;
  label: string;
  kind: ItemKind;
  checked: boolean;
  location_status: string | null;
  position: number;
};
type UpdateRow = {
  id: string;
  job_id: string;
  kind: UpdateEntry["kind"];
  field: string;
  old_value: string;
  new_value: string;
  task_id: string | null;
  message: string | null;
  notify: boolean;
  created_at: string;
  seen_at: string | null;
};

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

function localChildId(databaseId: string): string {
  return databaseId.slice(databaseId.lastIndexOf("-") + 1);
}

function databaseChildId(jobId: string, childId: string): string {
  return childId.startsWith(`${jobId}-`) ? childId : `${jobId}-${childId}`;
}

/** Updates the technician has not tapped "Seen" on yet. */
export function openEntries(job: Job): UpdateEntry[] {
  return job.history.filter((entry) => entry.notify && !entry.seenAt);
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

function mapJob(job: JobRow, tasks: TaskRow[], items: ItemRow[], updates: UpdateRow[]): Job {
  return {
    id: job.id,
    technicianId: job.technician_id,
    project: job.project,
    customer: job.customer,
    address: job.address,
    timeslot: job.timeslot,
    jobType: job.job_type,
    status: job.status,
    tasks: tasks
      .filter((task) => task.job_id === job.id)
      .sort((a, b) => a.position - b.position)
      .map((task) => ({ id: localChildId(task.id), label: task.label })),
    items: items
      .filter((item) => item.job_id === job.id)
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        id: localChildId(item.id),
        label: item.label,
        kind: item.kind,
        checked: item.checked,
        locationStatus: item.location_status ?? undefined,
      })),
    workspaceAvailable: job.workspace_available,
    history: updates
      .filter((update) => update.job_id === job.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((update) => ({
        id: update.id,
        at: update.created_at,
        kind: update.kind,
        field: update.field,
        oldValue: update.old_value,
        newValue: update.new_value,
        taskId: update.task_id ? localChildId(update.task_id) : undefined,
        message: update.message ?? undefined,
        notify: update.notify,
        seenAt: update.seen_at ?? undefined,
      })),
  };
}

export async function getJobs(): Promise<Job[]> {
  const [jobsResult, tasksResult, itemsResult, updatesResult] = await Promise.all([
    supabase.from("jobs").select("*"),
    supabase.from("job_tasks").select("*"),
    supabase.from("required_items").select("*"),
    supabase.from("job_updates").select("*"),
  ]);
  throwIfError(jobsResult.error);
  throwIfError(tasksResult.error);
  throwIfError(itemsResult.error);
  throwIfError(updatesResult.error);

  return (jobsResult.data as JobRow[])
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((job) =>
      mapJob(
        job,
        (tasksResult.data ?? []) as TaskRow[],
        (itemsResult.data ?? []) as ItemRow[],
        (updatesResult.data ?? []) as UpdateRow[],
      ),
    );
}

export function nextJobId(jobs: Job[]): string {
  const max = jobs.reduce((largest, job) => {
    const number = Number.parseInt(job.id.replace(/\D/g, ""), 10);
    return Number.isFinite(number) ? Math.max(largest, number) : largest;
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

function yn(value: boolean): string {
  return value ? "Available" : "Not available";
}

export async function createJob(input: NewJobInput, at = new Date().toISOString()): Promise<Job> {
  const jobs = await getJobs();
  const id = nextJobId(jobs);
  const { error: jobError } = await supabase.from("jobs").insert({
    id,
    technician_id: input.technicianId,
    project: input.project,
    customer: input.customer,
    address: input.address,
    timeslot: input.timeslot,
    job_type: input.jobType,
    status: "not-started",
    workspace_available: input.workspaceAvailable,
    created_at: at,
    updated_at: at,
  });
  throwIfError(jobError);

  const tasks = input.tasks.filter(Boolean).map((label, position) => ({
    id: `${id}-t${position + 1}`,
    job_id: id,
    label,
    position: position + 1,
  }));
  const items = input.items
    .filter((item) => item.label)
    .map((item, position) => ({
      id: `${id}-i${position + 1}`,
      job_id: id,
      label: item.label,
      kind: item.kind,
      checked: false,
      location_status: null,
      position: position + 1,
    }));
  if (tasks.length) throwIfError((await supabase.from("job_tasks").insert(tasks)).error);
  if (items.length) throwIfError((await supabase.from("required_items").insert(items)).error);
  throwIfError(
    (
      await supabase.from("job_updates").insert({
        id: `${id}-u1`,
        job_id: id,
        kind: "created",
        field: "Job",
        old_value: "",
        new_value: input.project,
        notify: true,
        created_at: at,
      })
    ).error,
  );

  const created = (await getJobs()).find((job) => job.id === id);
  if (!created) throw new Error("Supabase created the job but it could not be loaded.");
  return created;
}

export async function editJob(
  id: string,
  changes: JobChanges,
  opts: { message?: string; notify: boolean },
  at = new Date().toISOString(),
): Promise<void> {
  const job = (await getJobs()).find((candidate) => candidate.id === id);
  if (!job) throw new Error(`Job ${id} was not found.`);
  const entries: Array<Record<string, unknown>> = [];
  const updates = {
    kind: "edited" as const,
    message: opts.message?.trim() || null,
    notify: opts.notify,
    job_id: id,
    created_at: at,
  };
  const jobChanges: Record<string, unknown> = {};

  for (const key of ["project", "customer", "address", "timeslot", "jobType"] as const) {
    const value = changes[key];
    if (value !== undefined && value !== job[key]) {
      entries.push({
        ...updates,
        id: `${id}-u-${Date.now()}-${entries.length}`,
        field: FIELD_LABELS[key],
        old_value: job[key],
        new_value: value,
      });
      jobChanges[key === "jobType" ? "job_type" : key] = value;
    }
  }
  if (
    changes.workspaceAvailable !== undefined &&
    changes.workspaceAvailable !== job.workspaceAvailable
  ) {
    entries.push({
      ...updates,
      id: `${id}-u-${Date.now()}-${entries.length}`,
      field: "Workspace",
      old_value: yn(job.workspaceAvailable),
      new_value: yn(changes.workspaceAvailable),
    });
    jobChanges.workspace_available = changes.workspaceAvailable;
  }
  if (changes.tasks) {
    const nextTasks = changes.tasks.filter(Boolean);
    if (job.tasks.map((task) => task.label).join("; ") !== nextTasks.join("; ")) {
      await replaceTasks(id, nextTasks);
      const count = Math.max(job.tasks.length, nextTasks.length);
      for (let i = 0; i < count; i += 1) {
        const oldTask = job.tasks[i];
        const newLabel = nextTasks[i];
        if (oldTask?.label !== newLabel) {
          entries.push({
            ...updates,
            id: `${id}-u-${Date.now()}-${entries.length}`,
            field: "Task",
            old_value: oldTask?.label ?? "",
            new_value: newLabel ?? "Removed",
            task_id: newLabel ? `${id}-t${i + 1}` : null,
          });
        }
      }
    }
  }
  if (changes.items) {
    const nextItems = changes.items.filter((item) => item.label);
    const oldLabels = job.items.map((item) => `${item.label} (${item.kind})`).join("; ");
    const newLabels = nextItems.map((item) => `${item.label} (${item.kind})`).join("; ");
    if (oldLabels !== newLabels) {
      await replaceItems(id, nextItems);
      entries.push({
        ...updates,
        id: `${id}-u-${Date.now()}-${entries.length}`,
        field: "Required items",
        old_value: oldLabels,
        new_value: newLabels,
      });
    }
  }
  if (Object.keys(jobChanges).length)
    throwIfError((await supabase.from("jobs").update(jobChanges).eq("id", id)).error);
  if (entries.length) throwIfError((await supabase.from("job_updates").insert(entries)).error);
}

async function replaceTasks(jobId: string, labels: string[]): Promise<void> {
  const existingResult = await supabase
    .from("job_tasks")
    .select("id, position")
    .eq("job_id", jobId)
    .order("position");
  throwIfError(existingResult.error);
  const existing = (existingResult.data ?? []) as Array<{ id: string; position: number }>;

  for (let position = 0; position < labels.length; position += 1) {
    const task = existing[position];
    if (task) {
      throwIfError(
        (
          await supabase
            .from("job_tasks")
            .update({ label: labels[position], position: position + 1 })
            .eq("id", task.id)
        ).error,
      );
    } else {
      throwIfError(
        (
          await supabase.from("job_tasks").insert({
            id: `${jobId}-t${position + 1}`,
            job_id: jobId,
            label: labels[position],
            position: position + 1,
          })
        ).error,
      );
    }
  }

  for (const task of existing.slice(labels.length)) {
    throwIfError((await supabase.from("job_tasks").delete().eq("id", task.id)).error);
  }
}

async function replaceItems(
  jobId: string,
  items: { label: string; kind: ItemKind }[],
): Promise<void> {
  throwIfError((await supabase.from("required_items").delete().eq("job_id", jobId)).error);
  if (items.length)
    throwIfError(
      (
        await supabase.from("required_items").insert(
          items.map((item, position) => ({
            id: `${jobId}-i${position + 1}`,
            job_id: jobId,
            label: item.label,
            kind: item.kind,
            checked: false,
            location_status: null,
            position: position + 1,
          })),
        )
      ).error,
    );
}

export async function reassignJob(
  id: string,
  technicianId: string,
  opts: { message?: string; notify: boolean },
  at = new Date().toISOString(),
): Promise<void> {
  const job = (await getJobs()).find((candidate) => candidate.id === id);
  if (!job || job.technicianId === technicianId) return;
  throwIfError(
    (await supabase.from("jobs").update({ technician_id: technicianId }).eq("id", id)).error,
  );
  throwIfError(
    (
      await supabase.from("job_updates").insert({
        id: `${id}-u-${Date.now()}`,
        job_id: id,
        kind: "reassigned",
        field: "Assigned technician",
        old_value: technicianName(job.technicianId),
        new_value: technicianName(technicianId),
        message: opts.message?.trim() || null,
        notify: opts.notify,
        created_at: at,
      })
    ).error,
  );
}

export async function markJobUpdatesSeen(id: string, at = new Date().toISOString()): Promise<void> {
  throwIfError(
    (
      await supabase
        .from("job_updates")
        .update({ seen_at: at })
        .eq("job_id", id)
        .eq("notify", true)
        .is("seen_at", null)
    ).error,
  );
}

export async function resetDemoData(): Promise<void> {
  throwIfError((await supabase.rpc("reset_demo_data")).error);
}
