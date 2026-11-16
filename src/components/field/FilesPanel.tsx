import { useRef, useState } from "react";
import {
  Download,
  File as FileIcon,
  FileImage,
  FileSpreadsheet,
  FileText,
  Trash2,
  Upload,
} from "lucide-react";
import { requesterName, type Job, type JobFile } from "@/data/jobs";
import { formatFileSize, formatTime, jobFileDownloadUrl } from "@/data/store";
import { useTechnician } from "@/state/technician";
import { FieldButton } from "./FieldButton";

/** Picks an icon from the file's type or extension. */
function iconFor(file: Pick<JobFile, "name" | "contentType">) {
  const name = file.name.toLowerCase();
  const type = file.contentType ?? "";
  if (/\.(xlsx?|xlsm|csv|ods|numbers)$/.test(name) || type.includes("spreadsheet") || type.includes("excel") || type === "text/csv") {
    return FileSpreadsheet;
  }
  if (type.startsWith("image/")) return FileImage;
  if (/\.(pdf|docx?|odt|txt|rtf)$/.test(name) || type === "application/pdf" || type.startsWith("text/")) {
    return FileText;
  }
  return FileIcon;
}

/**
 * Files attached to a job: Excel sheets, PDFs, drawings, …
 * Anyone on the job can upload and download; the uploader or the supervisor can remove a file.
 */
export function FilesPanel({ job, role }: { job: Job; role: "technician" | "supervisor" }) {
  const { uploadFile, technicianId } = useTechnician();
  const files = (job.files ?? []).filter((file) => file.kind === "file");
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const me = role === "supervisor" ? "supervisor" : technicianId;

  async function upload(list: FileList) {
    const chosen = Array.from(list);
    const failed: string[] = [];
    setErrors([]);
    for (const [index, file] of chosen.entries()) {
      setProgress(
        chosen.length === 1 ? `Uploading ${file.name}…` : `Uploading ${index + 1} of ${chosen.length}…`,
      );
      try {
        await uploadFile(job.id, file, me);
      } catch (err) {
        failed.push(err instanceof Error ? err.message : `"${file.name}" could not be uploaded.`);
      }
    }
    setProgress(null);
    setErrors(failed);
    if (input.current) input.current.value = "";
  }

  return (
    <section aria-label="Files" className="space-y-3">
      <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
        Files
      </h2>

      {files.length === 0 && (
        <p className="rounded-2xl border border-border bg-card px-4 py-3 font-semibold text-muted-foreground">
          No files attached yet.
        </p>
      )}

      {files.length > 0 && (
        <ul className="divide-y divide-border rounded-3xl border border-border bg-card">
          {files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              canRemove={role === "supervisor" || file.uploadedBy === me}
            />
          ))}
        </ul>
      )}

      {!job.cancellation && (
        <>
          <input
            ref={input}
            type="file"
            multiple
            className="sr-only"
            aria-label="Choose files to upload"
            onChange={(e) => e.target.files?.length && void upload(e.target.files)}
          />
          <FieldButton
            variant="tile"
            className="flex-row text-base"
            disabled={Boolean(progress)}
            onClick={() => input.current?.click()}
          >
            <Upload className="size-5" />
            {progress ?? "Upload a file"}
          </FieldButton>
          <p className="text-sm font-semibold text-muted-foreground">
            Excel, PDF, Word, drawings and other files, up to 20 MB each.
          </p>
        </>
      )}

      {errors.map((message) => (
        <p key={message} role="alert" className="font-semibold text-cancel-foreground">
          {message}
        </p>
      ))}
    </section>
  );
}

function FileRow({ file, canRemove }: { file: JobFile; canRemove: boolean }) {
  const { deleteFile } = useTechnician();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Icon = iconFor(file);

  async function run(action: () => Promise<void>, failure: string) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : failure);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="space-y-3 p-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-7 shrink-0 text-brand-ink" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="break-all font-bold leading-snug">{file.name}</p>
          <p className="text-sm font-semibold text-muted-foreground">
            {formatFileSize(file.sizeBytes)} · {requesterName(file.uploadedBy)} ·{" "}
            {formatTime(file.createdAt)}
          </p>
        </div>
      </div>
      {confirming ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <FieldButton
            variant="danger"
            className="text-base"
            disabled={busy}
            onClick={() => void run(() => deleteFile(file), "The file could not be removed.")}
          >
            <Trash2 className="size-5" />
            {busy ? "Removing…" : "Yes, remove file"}
          </FieldButton>
          <FieldButton
            variant="tile"
            className="flex-row text-base"
            onClick={() => setConfirming(false)}
          >
            Keep file
          </FieldButton>
        </div>
      ) : (
        <div className={`grid gap-2 ${canRemove ? "grid-cols-[minmax(0,1fr)_auto]" : ""}`}>
          <FieldButton
            variant="tile"
            className="min-h-tap flex-row py-2 text-base"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                window.location.href = await jobFileDownloadUrl(file);
              }, "The file could not be downloaded.")
            }
          >
            <Download className="size-5" />
            Download
          </FieldButton>
          {canRemove && (
            <FieldButton
              variant="tile"
              aria-label={`Remove ${file.name}`}
              className="min-h-tap w-tap flex-row p-0"
              onClick={() => setConfirming(true)}
            >
              <Trash2 className="size-5" />
            </FieldButton>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-cancel-foreground">
          {error}
        </p>
      )}
    </li>
  );
}
