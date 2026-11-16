import { supabase } from "@/lib/supabase";
import { formatScheduleAbsolute, scheduleFromDraft, type ScheduleDraft } from "./planning";
import {
  CANCEL_REASON_LABELS,
  jobCode,
  partOrderCode,
  technicianName,
  type CancelReason,
  type ItemKind,
  type Job,
  type JobFile,
  type PartOrder,
  type PartOrderStatus,
  type UpdateEntry,
} from "./jobs";

/** What a job card shows: cancellation wins over an unseen update, which wins over the stored status. */
export type DisplayStatus = "cancelled" | "updated" | Job["status"];

export type ReportStatus = "draft" | "submitted" | "reviewed";
export type ReportProblem = { tag: string; note?: string };
export type ReportMaterial = { name: string; used: boolean; isExtra: boolean };
export type ReportPhoto = { id: string; storagePath: string; url: string; createdAt: string };
export type JobReport = {
  id: string;
  jobId: string;
  technicianId: string;
  notes: string;
  nothingToReport: boolean;
  problems: ReportProblem[];
  materials: ReportMaterial[];
  photos: ReportPhoto[];
  followUpNeeded: boolean;
  followUpText?: string;
  startedAt?: string;
  endedAt?: string;
  status: ReportStatus;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ReportDraftInput = {
  jobId: string;
  technicianId: string;
  notes: string;
  nothingToReport: boolean;
  problems: ReportProblem[];
  materials: ReportMaterial[];
  followUpNeeded: boolean;
  followUpText?: string;
  startedAt?: string;
  endedAt?: string;
};

export function reportSubmissionReady(input: Pick<ReportDraftInput, "notes" | "nothingToReport">): boolean {
  return Boolean(input.notes.trim() || input.nothingToReport);
}

export function displayStatus(job: Job, hasOpenUpdate: boolean): DisplayStatus {
  if (job.cancellation) return "cancelled";
  if (hasOpenUpdate) return "updated";
  return job.status;
}

export type TechnicianJobFilters = {
  search?: string;
  status?: DisplayStatus | "all";
  jobType?: string;
  sort?: "default" | "project";
};

export function filterTechnicianJobs(
  jobs: Job[],
  hasOpenUpdate: (job: Job) => boolean,
  filters: TechnicianJobFilters,
): Job[] {
  const search = filters.search?.trim().toLocaleLowerCase() ?? "";
  const status = filters.status ?? "all";
  const jobType = filters.jobType ?? "all";
  const filtered = jobs.filter((job) => {
    const display = displayStatus(job, hasOpenUpdate(job));
    return (
      (!search || matchesJobSearch(job, search)) &&
      (status === "all" || display === status) &&
      (jobType === "all" || job.jobType === jobType)
    );
  });

  if (filters.sort !== "project") return filtered;
  return [...filtered].sort((a, b) => a.project.localeCompare(b.project));
}

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
  job_year?: number | null;
  job_seq?: number | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  cancel_reason?: CancelReason | null;
  cancel_note?: string | null;
  cancelled_at?: string | null;
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
type ReportRow = {
  id: string;
  job_id: string;
  technician_id: string;
  notes: string;
  nothing_to_report: boolean;
  follow_up_needed: boolean;
  follow_up_text: string | null;
  started_at: string | null;
  ended_at: string | null;
  status: ReportStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};
type ReportProblemRow = { id: string; report_id: string; tag: string; note: string | null };
type ReportMaterialRow = {
  id: string;
  report_id: string;
  name: string;
  used: boolean;
  is_extra: boolean;
  position: number;
};
type ReportPhotoRow = {
  id: string;
  report_id: string;
  storage_path: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
};

const REPORT_PHOTO_BUCKET = "report-photos";

type PartOrderRow = {
  id: string;
  job_id: string;
  seq: number;
  part: string;
  quantity: number;
  note: string | null;
  status: PartOrderStatus;
  requested_by: string;
  created_at: string;
  ordered_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
};

function mapPartOrder(row: PartOrderRow): PartOrder {
  return {
    id: row.id,
    seq: row.seq,
    part: row.part,
    quantity: row.quantity,
    note: row.note ?? undefined,
    status: row.status,
    requestedBy: row.requested_by,
    createdAt: row.created_at,
    orderedAt: row.ordered_at ?? undefined,
    deliveredAt: row.delivered_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
  };
}

type JobFileRow = {
  id: string;
  job_id: string;
  kind?: "file" | "photo" | null; // missing until the job-photos migration is applied
  name: string;
  storage_path: string;
  size_bytes: number;
  content_type: string | null;
  uploaded_by: string;
  created_at: string;
};

function mapJobFile(row: JobFileRow): JobFile {
  return {
    id: row.id,
    kind: row.kind === "photo" ? "photo" : "file",
    name: row.name,
    storagePath: row.storage_path,
    sizeBytes: Number(row.size_bytes),
    contentType: row.content_type ?? undefined,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  };
}

/** True when Supabase says a table does not exist yet (its migration has not been run). */
function isMissingTable(error: { code?: string; message: string } | null): boolean {
  return Boolean(
    error && (error.code === "42P01" || error.code === "PGRST205" || /could not find the table/i.test(error.message)),
  );
}

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

function createPhotoStorageId(): string {
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
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

function mapJob(
  job: JobRow,
  tasks: TaskRow[],
  items: ItemRow[],
  updates: UpdateRow[],
  parts: PartOrderRow[] = [],
  files: JobFileRow[] = [],
): Job {
  return {
    id: job.id,
    number: job.job_year && job.job_seq ? { year: job.job_year, sequence: job.job_seq } : undefined,
    technicianId: job.technician_id,
    project: job.project,
    customer: job.customer,
    address: job.address,
    timeslot: job.timeslot,
    // Normalised to toISOString() so schedules from the database and the form compare as strings.
    schedule:
      job.scheduled_start && job.scheduled_end
        ? {
            start: new Date(job.scheduled_start).toISOString(),
            end: new Date(job.scheduled_end).toISOString(),
          }
        : undefined,
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
    parts: parts
      .filter((order) => order.job_id === job.id)
      .sort((a, b) => a.seq - b.seq)
      .map(mapPartOrder),
    files: files
      .filter((file) => file.job_id === job.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(mapJobFile),
    cancellation: job.cancel_reason
      ? {
          reason: job.cancel_reason,
          note: job.cancel_note ?? undefined,
          at: job.cancelled_at ?? "",
        }
      : undefined,
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
  const [jobsResult, tasksResult, itemsResult, updatesResult, partsResult, filesResult] =
    await Promise.all([
      supabase.from("jobs").select("*"),
      supabase.from("job_tasks").select("*"),
      supabase.from("required_items").select("*"),
      supabase.from("job_updates").select("*"),
      supabase.from("part_orders").select("*"),
      supabase.from("job_files").select("*"),
    ]);
  throwIfError(jobsResult.error);
  throwIfError(tasksResult.error);
  throwIfError(itemsResult.error);
  throwIfError(updatesResult.error);
  // Before the part-orders migration is run the app keeps working, just without parts.
  if (!isMissingTable(partsResult.error)) throwIfError(partsResult.error);
  const partRows = partsResult.error ? [] : ((partsResult.data ?? []) as PartOrderRow[]);
  if (!isMissingTable(filesResult.error)) throwIfError(filesResult.error);
  const fileRows = filesResult.error ? [] : ((filesResult.data ?? []) as JobFileRow[]);

  return (jobsResult.data as JobRow[])
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((job) =>
      mapJob(
        job,
        (tasksResult.data ?? []) as TaskRow[],
        (itemsResult.data ?? []) as ItemRow[],
        (updatesResult.data ?? []) as UpdateRow[],
        partRows,
        fileRows,
      ),
    );
}

function mapReport(
  report: ReportRow,
  problems: ReportProblemRow[],
  materials: ReportMaterialRow[],
  photos: ReportPhotoRow[],
  photoUrls: Map<string, string>,
): JobReport {
  return {
    id: report.id,
    jobId: report.job_id,
    technicianId: report.technician_id,
    notes: report.notes,
    nothingToReport: report.nothing_to_report,
    problems: problems
      .filter((problem) => problem.report_id === report.id)
      .map((problem) => ({ tag: problem.tag, note: problem.note ?? undefined })),
    materials: materials
      .filter((material) => material.report_id === report.id)
      .sort((a, b) => a.position - b.position)
      .map((material) => ({
        name: material.name,
        used: material.used,
        isExtra: material.is_extra,
      })),
    photos: photos
      .filter((photo) => photo.report_id === report.id)
      .map((photo) => ({
        id: photo.id,
        storagePath: photo.storage_path,
        url: photoUrls.get(photo.id) ?? "",
        createdAt: photo.created_at,
      })),
    followUpNeeded: report.follow_up_needed,
    followUpText: report.follow_up_text ?? undefined,
    startedAt: report.started_at ?? undefined,
    endedAt: report.ended_at ?? undefined,
    status: report.status,
    submittedAt: report.submitted_at ?? undefined,
    reviewedAt: report.reviewed_at ?? undefined,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
  };
}

export async function getReports(): Promise<JobReport[]> {
  const [reportsResult, problemsResult, materialsResult, photosResult] = await Promise.all([
    supabase.from("reports").select("*"),
    supabase.from("report_problems").select("*"),
    supabase.from("report_materials").select("*"),
    supabase.from("report_photos").select("*").order("created_at"),
  ]);
  throwIfError(reportsResult.error);
  throwIfError(problemsResult.error);
  throwIfError(materialsResult.error);
  throwIfError(photosResult.error);
  const photoRows = (photosResult.data ?? []) as ReportPhotoRow[];
  const photoUrls = new Map<string, string>();
  await Promise.all(
    photoRows.map(async (photo) => {
      const { data, error } = await supabase.storage
        .from(REPORT_PHOTO_BUCKET)
        .createSignedUrl(photo.storage_path, 3600);
      throwIfError(error);
      if (!data?.signedUrl) throw new Error(`Photo ${photo.id} did not return a signed URL.`);
      photoUrls.set(photo.id, data.signedUrl);
    }),
  );
  return Promise.all(
    ((reportsResult.data ?? []) as ReportRow[]).map((report) =>
      mapReport(
        report,
        (problemsResult.data ?? []) as ReportProblemRow[],
        (materialsResult.data ?? []) as ReportMaterialRow[],
        photoRows,
        photoUrls,
      ),
    ),
  );
}

export async function getReportForJob(jobId: string): Promise<JobReport | undefined> {
  return (await getReports()).find((report) => report.jobId === jobId);
}

function reportRows(input: ReportDraftInput, reportId: string) {
  return {
    problems: input.problems
      .filter((problem) => problem.tag.trim())
      .map((problem) => ({ report_id: reportId, tag: problem.tag.trim(), note: problem.note?.trim() || null })),
    materials: input.materials
      .filter((material) => material.name.trim())
      .map((material, position) => ({
        report_id: reportId,
        name: material.name.trim(),
        used: material.used,
        is_extra: material.isExtra,
        position: position + 1,
      })),
  };
}

export async function saveReportDraft(input: ReportDraftInput): Promise<JobReport> {
  const existing = await getReportForJob(input.jobId);
  if (existing && existing.status !== "draft") {
    throw new Error("This report has already been submitted and is read-only.");
  }
  const { data: reportRow, error: reportError } = await supabase
    .from("reports")
    .upsert(
      {
        id: existing?.id,
        job_id: input.jobId,
        technician_id: input.technicianId,
        notes: input.notes,
        nothing_to_report: input.nothingToReport,
        follow_up_needed: input.followUpNeeded,
        follow_up_text: input.followUpText?.trim() || null,
        started_at: input.startedAt || null,
        ended_at: input.endedAt || null,
        status: "draft",
      },
      { onConflict: "job_id" },
    )
    .select("*")
    .single();
  throwIfError(reportError);
  if (!reportRow) throw new Error("The report draft was not returned by Supabase.");
  const rows = reportRows(input, (reportRow as ReportRow).id);
  throwIfError((await supabase.from("report_problems").delete().eq("report_id", (reportRow as ReportRow).id)).error);
  throwIfError((await supabase.from("report_materials").delete().eq("report_id", (reportRow as ReportRow).id)).error);
  if (rows.problems.length) throwIfError((await supabase.from("report_problems").insert(rows.problems)).error);
  if (rows.materials.length) throwIfError((await supabase.from("report_materials").insert(rows.materials)).error);
  const saved = await getReportForJob(input.jobId);
  if (!saved) throw new Error("The report draft was saved but could not be loaded.");
  return saved;
}

export async function submitReport(input: ReportDraftInput): Promise<JobReport> {
  if (!reportSubmissionReady(input)) {
    throw new Error("Add a report note or select Nothing to report before submitting.");
  }
  const draft = await saveReportDraft(input);
  const submittedAt = new Date().toISOString();
  const { error: reportError } = await supabase
    .from("reports")
    .update({ status: "submitted", submitted_at: submittedAt })
    .eq("id", draft.id);
  throwIfError(reportError);
  const { error: jobError } = await supabase
    .from("jobs")
    .update({ status: "done" })
    .eq("id", input.jobId);
  throwIfError(jobError);
  const submitted = await getReportForJob(input.jobId);
  if (!submitted) throw new Error("The report was submitted but could not be loaded.");
  return submitted;
}

export async function markReportReviewed(reportId: string): Promise<void> {
  const { data, error } = await supabase
    .from("reports")
    .update({ status: "reviewed", reviewed_at: new Date().toISOString() })
    .eq("id", reportId)
    .eq("status", "submitted")
    .select("id")
    .maybeSingle();
  throwIfError(error);
  if (!data) throw new Error("Only a submitted report can be marked as reviewed.");
}

async function resizeReportPhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Only image files can be added to a report.");
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("The selected image could not be read."));
      element.src = sourceUrl;
    });
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The browser could not prepare the selected image.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("The selected image could not be resized."))),
        "image/jpeg",
        0.82,
      );
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export async function uploadReportPhoto(reportId: string, file: File): Promise<ReportPhoto> {
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("status")
    .eq("id", reportId)
    .single();
  throwIfError(reportError);
  if (report?.status !== "draft") throw new Error("Photos can only be added to a draft report.");

  const { count, error: countError } = await supabase
    .from("report_photos")
    .select("id", { count: "exact", head: true })
    .eq("report_id", reportId);
  throwIfError(countError);
  if ((count ?? 0) >= 5) throw new Error("A report can contain at most five photos.");

  const resized = await resizeReportPhoto(file);
  const storagePath = `${reportId}/${createPhotoStorageId()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from(REPORT_PHOTO_BUCKET)
    .upload(storagePath, resized, { contentType: "image/jpeg", upsert: false });
  throwIfError(uploadError);

  const { data: photoRow, error: photoError } = await supabase
    .from("report_photos")
    .insert({
      report_id: reportId,
      storage_path: storagePath,
      content_type: "image/jpeg",
      size_bytes: resized.size,
    })
    .select("*")
    .single();
  if (photoError) {
    const cleanup = await supabase.storage.from(REPORT_PHOTO_BUCKET).remove([storagePath]);
    if (cleanup.error) {
      throw new Error(`${photoError.message} Photo cleanup also failed: ${cleanup.error.message}`);
    }
    throw new Error(photoError.message);
  }
  const { data: signed, error: signedError } = await supabase.storage
    .from(REPORT_PHOTO_BUCKET)
    .createSignedUrl(storagePath, 3600);
  throwIfError(signedError);
  if (!signed?.signedUrl) throw new Error("The uploaded photo did not return a signed URL.");
  const saved = photoRow as ReportPhotoRow;
  return {
    id: saved.id,
    storagePath: saved.storage_path,
    url: signed.signedUrl,
    createdAt: saved.created_at,
  };
}

export async function deleteReportPhoto(photoId: string): Promise<void> {
  const { data: photo, error: photoError } = await supabase
    .from("report_photos")
    .select("storage_path")
    .eq("id", photoId)
    .single();
  throwIfError(photoError);
  if (!photo) throw new Error("The report photo could not be found.");
  const storagePath = (photo as { storage_path: string }).storage_path;
  throwIfError((await supabase.storage.from(REPORT_PHOTO_BUCKET).remove([storagePath])).error);
  throwIfError((await supabase.from("report_photos").delete().eq("id", photoId)).error);
}

/** Empties a Storage bucket (files at the top level and one folder deep). */
async function removeAllObjects(bucket: string): Promise<void> {
  const { data: entries, error: listError } = await supabase.storage
    .from(bucket)
    .list("", { limit: 1000 });
  if (listError && /bucket not found/i.test(listError.message)) return; // migration not run yet
  throwIfError(listError);

  const paths: string[] = [];
  for (const entry of entries ?? []) {
    if (entry.id) {
      paths.push(entry.name);
      continue;
    }

    const { data: nestedEntries, error: nestedListError } = await supabase.storage
      .from(bucket)
      .list(entry.name, { limit: 1000 });
    throwIfError(nestedListError);
    for (const nestedEntry of nestedEntries ?? []) {
      if (nestedEntry.id) paths.push(`${entry.name}/${nestedEntry.name}`);
    }
  }

  if (paths.length > 0) {
    throwIfError((await supabase.storage.from(bucket).remove(paths)).error);
  }
}

export function nextJobId(jobs: Job[]): string {
  const max = jobs.reduce((largest, job) => {
    const number = Number.parseInt(job.id.replace(/\D/g, ""), 10);
    return Number.isFinite(number) ? Math.max(largest, number) : largest;
  }, 0);
  return `J-${max + 1}`;
}

/** Lowercase letters and digits only, so "J26-0042", "j26 0042" and "J260042" compare equal. */
function compact(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * True when the job matches a search on job number, project, customer or address.
 * "J26-0042", "j26 42", "26-42", "0042" and "42" all find the 42nd job of 2026.
 */
export function matchesJobSearch(job: Job, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (/^\d+$/.test(q)) {
    // A bare number is the job's place in its year ("42" or "0042"), or a legacy id ("2481").
    if (job.number?.sequence === Number(q)) return true;
    if (compact(job.id).endsWith(q)) return true;
  } else {
    // Year and number written separately: "26-42", "J26 0042", "j26/42".
    const parts = q.match(/^j?\s*(\d{2})\s*[-/\s]\s*(\d+)$/);
    if (
      parts &&
      job.number &&
      job.number.year % 100 === Number(parts[1]) &&
      job.number.sequence === Number(parts[2])
    ) {
      return true;
    }
    // A full or partly typed code: "J260042", "J26-00".
    const typed = compact(q);
    if (/^j\d/.test(typed) && compact(jobCode(job)).startsWith(typed)) return true;
    if (typed === compact(job.id)) return true;
    // A part order number: "J26-0042-P1".
    if (/^j\d+p\d+$/.test(typed)) {
      return (job.parts ?? []).some((order) => compact(partOrderCode(job, order)) === typed);
    }
  }
  return [job.project, job.customer, job.address, ...(job.parts ?? []).map((o) => o.part)].some((value) =>
    value.toLowerCase().includes(q),
  );
}

const UNIQUE_VIOLATION = "23505";

export type NewJobInput = {
  project: string;
  customer: string;
  address: string;
  schedule: ScheduleDraft;
  jobType: string;
  technicianId: string;
  tasks: string[];
  items: { label: string; kind: ItemKind }[];
  workspaceAvailable: boolean;
};

export type ReadyCheckStatus = "unknown" | "available" | "missing";

export type ReadyCheckSummary = {
  totalItems: number;
  checkedItems: number;
  missingItems: number;
  ready: boolean;
};

export function readyCheckSummary(job: Job): ReadyCheckSummary {
  const missingItems = job.items.filter((item) => item.locationStatus === "missing").length;
  const checkedItems = job.items.filter(
    (item) => item.checked && item.locationStatus === "available",
  ).length;
  return {
    totalItems: job.items.length,
    checkedItems,
    missingItems,
    ready: job.workspaceAvailable && missingItems === 0 && checkedItems === job.items.length,
  };
}

export type JobChanges = {
  project?: string;
  customer?: string;
  address?: string;
  schedule?: ScheduleDraft;
  jobType?: string;
  workspaceAvailable?: boolean;
  tasks?: string[];
  items?: { label: string; kind: ItemKind }[];
};

const FIELD_LABELS = {
  project: "Project",
  customer: "Customer",
  address: "Address",
  jobType: "Job type",
} as const;

function yn(value: boolean): string {
  return value ? "Available" : "Not available";
}

export async function createJob(input: NewJobInput, at = new Date().toISOString()): Promise<Job> {
  const schedule = scheduleFromDraft(input.schedule);
  // The database hands out the internal id (J-2492…) and the readable job
  // number (J26-0005…), so two devices can never create the same one.
  const { data: createdRow, error: jobError } = await supabase.from("jobs").insert({
    technician_id: input.technicianId,
    project: input.project,
    customer: input.customer,
    address: input.address,
    timeslot: formatScheduleAbsolute(schedule),
    scheduled_start: schedule.start,
    scheduled_end: schedule.end,
    job_type: input.jobType,
    status: "not-started",
    workspace_available: input.workspaceAvailable,
    created_at: at,
    updated_at: at,
  }).select("id").single();
  throwIfError(jobError);
  const id = (createdRow as { id: string } | null)?.id;
  if (!id) throw new Error("Supabase created the job but did not return its unique ID.");

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

  if (changes.schedule) {
    const next = scheduleFromDraft(changes.schedule);
    if (next.start !== job.schedule?.start || next.end !== job.schedule?.end) {
      entries.push({
        ...updates,
        id: `${id}-u-${Date.now()}-${entries.length}`,
        field: "Planned time",
        old_value: job.schedule ? formatScheduleAbsolute(job.schedule) : job.timeslot,
        new_value: formatScheduleAbsolute(next),
      });
      jobChanges.scheduled_start = next.start;
      jobChanges.scheduled_end = next.end;
      jobChanges.timeslot = formatScheduleAbsolute(next);
    }
  }
  for (const key of ["project", "customer", "address", "jobType"] as const) {
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

/** Supervisor removes a job: it stays visible to the technician, marked cancelled with the reason. */
export async function cancelJob(
  id: string,
  reason: CancelReason,
  note: string | undefined,
  at = new Date().toISOString(),
): Promise<void> {
  const cancelNote = note?.trim() || null;
  throwIfError(
    (
      await supabase
        .from("jobs")
        .update({ cancel_reason: reason, cancel_note: cancelNote, cancelled_at: at })
        .eq("id", id)
    ).error,
  );
  throwIfError(
    (
      await supabase.from("job_updates").insert({
        id: `${id}-u-${Date.now()}`,
        job_id: id,
        kind: "cancelled",
        field: "Job",
        old_value: "",
        new_value: CANCEL_REASON_LABELS[reason],
        message: cancelNote,
        // The red cancelled highlight is the notice; no yellow "updated" banner on top.
        notify: false,
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

export async function updateRequiredItem(
  jobId: string,
  itemId: string,
  status: ReadyCheckStatus,
): Promise<void> {
  const databaseId = databaseChildId(jobId, itemId);
  throwIfError(
    (
      await supabase
        .from("required_items")
        .update({
          checked: status !== "unknown",
          location_status: status === "unknown" ? null : status,
        })
        .eq("id", databaseId)
        .eq("job_id", jobId)
    ).error,
  );
}

export async function updateWorkspaceAvailability(
  jobId: string,
  available: boolean,
): Promise<void> {
  throwIfError(
    (await supabase.from("jobs").update({ workspace_available: available }).eq("id", jobId)).error,
  );
}

export async function markJobReady(id: string, at = new Date().toISOString()): Promise<void> {
  const job = (await getJobs()).find((candidate) => candidate.id === id);
  if (!job) throw new Error(`Job ${id} was not found.`);
  const summary = readyCheckSummary(job);
  if (!summary.ready) {
    throw new Error("Complete every item and confirm the workspace before marking ready.");
  }
  throwIfError((await supabase.from("jobs").update({ status: "ready" }).eq("id", id)).error);
  throwIfError(
    (
      await supabase.from("job_updates").insert({
        id: `${id}-ready-${Date.now()}`,
        job_id: id,
        kind: "ready",
        field: "Ready check",
        old_value: job.status,
        new_value: "Ready",
        notify: false,
        created_at: at,
      })
    ).error,
  );
}

export type NewPartOrderInput = {
  part: string;
  quantity: number;
  note?: string | undefined;
  requestedBy: string; // technician id or "supervisor"
};

/** Next order number within a job: P1, P2, … */
export function nextPartOrderSeq(job: Pick<Job, "parts">): number {
  return (job.parts ?? []).reduce((max, order) => Math.max(max, order.seq), 0) + 1;
}

/** Order a part for a job. Returns the new order's per-job sequence number. */
export async function createPartOrder(
  jobId: string,
  input: NewPartOrderInput,
  at = new Date().toISOString(),
): Promise<number> {
  const part = input.part.trim();
  if (!part) throw new Error("Enter the part you need.");
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new Error("Quantity must be at least 1.");
  }
  // Like job numbers: claim the next number by inserting; retry if another device was quicker.
  for (let attempt = 0; ; attempt += 1) {
    const job = (await getJobs()).find((candidate) => candidate.id === jobId);
    if (!job) throw new Error(`Job ${jobId} was not found.`);
    if (job.cancellation) throw new Error("This job was cancelled, so parts can no longer be ordered.");
    const seq = nextPartOrderSeq(job);
    const { error } = await supabase.from("part_orders").insert({
      id: `${jobId}-p${seq}`,
      job_id: jobId,
      seq,
      part,
      quantity: input.quantity,
      note: input.note?.trim() || null,
      status: "requested",
      requested_by: input.requestedBy,
      created_at: at,
    });
    if (!error) return seq;
    if (isMissingTable(error)) {
      throw new Error("Parts ordering is not set up in the database yet. Run the part-orders migration.");
    }
    if (error.code !== UNIQUE_VIOLATION || attempt >= 4) throwIfError(error);
  }
}

/** Which status an order may move to next. */
export const PART_ORDER_NEXT: Record<PartOrderStatus, PartOrderStatus[]> = {
  requested: ["ordered", "cancelled"],
  ordered: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export async function setPartOrderStatus(
  orderId: string,
  status: PartOrderStatus,
  at = new Date().toISOString(),
): Promise<void> {
  const timestamp = {
    requested: {},
    ordered: { ordered_at: at },
    delivered: { delivered_at: at },
    cancelled: { cancelled_at: at },
  }[status];
  const allowedFrom = (Object.keys(PART_ORDER_NEXT) as PartOrderStatus[]).filter((from) =>
    PART_ORDER_NEXT[from].includes(status),
  );
  const { data, error } = await supabase
    .from("part_orders")
    .update({ status, ...timestamp })
    .eq("id", orderId)
    .in("status", allowedFrom)
    .select("id");
  throwIfError(error);
  if (!data?.length) throw new Error("This order was already updated on another device. Reload to see it.");
}

const JOB_FILES_BUCKET = "job-files";

/** "Failed to fetch" (Chrome), "Load failed" (Safari), "NetworkError…" (Firefox). */
function isNetworkError(error: { message: string }): boolean {
  return /failed to fetch|load failed|networkerror|network request failed/i.test(error.message);
}

/**
 * Random id for storage paths. crypto.randomUUID only exists on https pages, and
 * phones testing the app over plain http on the local network do not have it.
 */
export function randomId(): string {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();
  if (typeof cryptoApi?.getRandomValues === "function") {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** Keeps letters, digits, dots, dashes and underscores so the name is a safe storage path. */
export function safeFileName(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|-+$/g, "");
  return cleaned.slice(-120) || "file";
}

/** "820 KB", "3.4 MB" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Upload a file or photo to a job: first the bytes to Storage, then the row that lists it. */
export async function uploadJobFile(
  jobId: string,
  file: File,
  uploadedBy: string,
  kind: JobFile["kind"] = "file",
): Promise<void> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`"${file.name}" is ${formatFileSize(file.size)}. Files can be at most 20 MB.`);
  }
  const path = `${jobId}/${randomId()}-${safeFileName(file.name)}`;
  // Right after the phone's camera closes the connection can need a moment to come back.
  let upload = await supabase.storage.from(JOB_FILES_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  for (let retry = 1; retry <= 2 && upload.error && isNetworkError(upload.error); retry += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500 * retry));
    upload = await supabase.storage.from(JOB_FILES_BUCKET).upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
  }
  if (upload.error) {
    if (/bucket not found/i.test(upload.error.message)) {
      throw new Error("File uploads are not set up in the database yet. Run the job-files migration.");
    }
    throw new Error(upload.error.message);
  }
  const { error } = await supabase.from("job_files").insert({
    job_id: jobId,
    name: file.name,
    storage_path: path,
    size_bytes: file.size,
    content_type: file.type || null,
    uploaded_by: uploadedBy,
    // Only sent for photos, so plain file uploads keep working before the photos migration.
    ...(kind === "photo" ? { kind } : {}),
  });
  if (error) {
    // Do not leave an unlisted file behind in Storage.
    await supabase.storage.from(JOB_FILES_BUCKET).remove([path]);
    if (/'kind' column/i.test(error.message)) {
      throw new Error("Photo uploads are not set up in the database yet. Run the job-photos migration.");
    }
    throwIfError(error);
  }
}

/** Viewable links for many photos at once (valid for an hour), keyed by storage path. */
export async function jobPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage
    .from(JOB_FILES_BUCKET)
    .createSignedUrls(paths, 60 * 60);
  throwIfError(error);
  const urls: Record<string, string> = {};
  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) urls[entry.path] = entry.signedUrl;
  }
  return urls;
}

/** A short-lived link that downloads the file under its original name. */
export async function jobFileDownloadUrl(file: Pick<JobFile, "storagePath" | "name">): Promise<string> {
  const { data, error } = await supabase.storage
    .from(JOB_FILES_BUCKET)
    .createSignedUrl(file.storagePath, 60, { download: file.name });
  throwIfError(error);
  if (!data?.signedUrl) throw new Error("The download link could not be created.");
  return data.signedUrl;
}

export async function deleteJobFile(file: Pick<JobFile, "id" | "storagePath">): Promise<void> {
  throwIfError((await supabase.from("job_files").delete().eq("id", file.id)).error);
  throwIfError((await supabase.storage.from(JOB_FILES_BUCKET).remove([file.storagePath])).error);
}

export async function resetDemoData(): Promise<void> {
  // Uploaded bytes live in Storage, which a database reset does not touch.
  await removeAllObjects(REPORT_PHOTO_BUCKET);
  await removeAllObjects(JOB_FILES_BUCKET);
  throwIfError((await supabase.rpc("reset_demo_data")).error);
}
