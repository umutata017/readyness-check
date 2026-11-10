import { useState } from "react";
import { Trash2 } from "lucide-react";
import { CANCEL_REASON_LABELS, type CancelReason } from "@/data/jobs";
import { useTechnician } from "@/state/technician";
import { FieldButton } from "./FieldButton";
import { FieldLabel, FieldSelect, fieldControlClass } from "./inputs";

/** Supervisor-only: red "Remove job" button that opens a reason + description form before cancelling the job. */
export function RemoveJobPanel({ jobId }: { jobId: string }) {
  const { cancelJob } = useTechnician();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<CancelReason>("resident");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <FieldButton variant="danger" onClick={() => setOpen(true)}>
        <Trash2 className="size-6" />
        Remove job
      </FieldButton>
    );
  }

  return (
    <form
      aria-label="Remove job"
      className="space-y-4 rounded-3xl border-2 border-cancel-border bg-cancel-surface p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
          await cancelJob(jobId, reason, note);
        } catch (err) {
          setError(err instanceof Error ? err.message : "The job could not be removed.");
          setSaving(false);
        }
      }}
    >
      <h2 className="font-display text-xl text-cancel-foreground">Remove this job?</h2>
      <p className="font-semibold">The technician will see the job marked as cancelled, with your reason.</p>
      <label className="block">
        <FieldLabel>Reason</FieldLabel>
        <FieldSelect value={reason} onChange={(e) => setReason(e.target.value as CancelReason)}>
          {(Object.keys(CANCEL_REASON_LABELS) as CancelReason[]).map((key) => (
            <option key={key} value={key}>
              {CANCEL_REASON_LABELS[key]}
            </option>
          ))}
        </FieldSelect>
      </label>
      <label className="block">
        <FieldLabel>Description (optional)</FieldLabel>
        <textarea
          className={fieldControlClass}
          rows={3}
          value={note}
          placeholder="E.g. resident is not home this week"
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="font-semibold text-cancel-foreground">
          {error}
        </p>
      )}
      <FieldButton type="submit" variant="danger" disabled={saving}>
        <Trash2 className="size-6" />
        {saving ? "Removing…" : "Confirm removal"}
      </FieldButton>
      <FieldButton type="button" variant="tile" className="flex-row text-base" onClick={() => setOpen(false)}>
        Keep job
      </FieldButton>
    </form>
  );
}
