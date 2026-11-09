import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, CheckCircle2, ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/field/AppShell";
import { FieldButton } from "@/components/field/FieldButton";
import { readyCheckSummary, type ReadyCheckStatus } from "@/data/store";
import { useTechnician } from "@/state/technician";

const kindLabels = {
  equipment: "Equipment",
  personnel: "Personnel",
  material: "Materials",
} as const;

export const Route = createFileRoute("/job/$jobId_/ready-check")({
  head: () => ({
    meta: [
      { title: "Ready check — AdvantiQ" },
      {
        name: "description",
        content: "Confirm the equipment, personnel, materials and workspace for this job.",
      },
    ],
  }),
  component: ReadyCheck,
});

function ReadyCheck() {
  const { jobId } = Route.useParams();
  const { getJob, hydrated, updateRequiredItem, updateWorkspaceAvailability, markJobReady } =
    useTechnician();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const job = getJob(jobId);

  if (!job && !hydrated) return <AppShell title="Loading ready check…" />;
  if (!job) throw notFound();

  const summary = readyCheckSummary(job);
  const groupedItems = Object.entries(kindLabels)
    .map(([kind, label]) => ({
      kind: kind as keyof typeof kindLabels,
      label,
      items: job.items.filter((item) => item.kind === kind),
    }))
    .filter((group) => group.items.length > 0);

  async function save(action: () => Promise<void>) {
    setSaving(true);
    setError(null);
    try {
      await action();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "The ready check could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title="Ready check"
      eyebrow={job.id}
      bottom={
        <FieldButton asChild variant="tile" className="min-h-tap flex-row text-base">
          <Link to="/job/$jobId" params={{ jobId }}>
            <ArrowLeft className="size-6" /> Back to job
          </Link>
        </FieldButton>
      }
    >
      <section className="rounded-3xl bg-card p-5">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="size-7 text-primary" />
          <div>
            <p className="font-display text-xl">{job.project}</p>
            <p className="text-sm font-semibold text-muted-foreground">
              Confirm everything before starting
            </p>
          </div>
        </div>
      </section>

      {groupedItems.map((group) => (
        <section key={group.kind} className="space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
            {group.label}
          </h2>
          {group.items.map((item) => {
            const status: ReadyCheckStatus =
              item.locationStatus === "available"
                ? "available"
                : item.locationStatus === "missing"
                  ? "missing"
                  : "unknown";
            return (
              <div
                key={item.id}
                className={`rounded-3xl border-2 p-4 ${status === "available" ? "border-success bg-card" : status === "missing" ? "border-change bg-change-surface" : "border-border bg-card"}`}
              >
                <div className="flex items-start gap-3">
                  {status === "available" ? (
                    <CheckCircle2 className="mt-1 size-6 shrink-0 text-success" />
                  ) : status === "missing" ? (
                    <AlertTriangle className="mt-1 size-6 shrink-0 text-change" />
                  ) : (
                    <ClipboardCheck className="mt-1 size-6 shrink-0 text-muted-foreground" />
                  )}
                  <p className="min-w-0 flex-1 text-lg font-bold">{item.label}</p>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(["unknown", "available", "missing"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={saving}
                      onClick={() => void save(() => updateRequiredItem(job.id, item.id, option))}
                      className={`min-h-tap rounded-2xl px-2 text-sm font-bold ${status === option ? (option === "available" ? "bg-success text-success-foreground" : option === "missing" ? "bg-change text-change-foreground" : "bg-secondary text-secondary-foreground") : "bg-muted text-muted-foreground"}`}
                    >
                      {option === "unknown"
                        ? "Not checked"
                        : option === "available"
                          ? "On site"
                          : "Missing"}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      ))}

      <section
        className={`rounded-3xl border-2 p-5 ${job.workspaceAvailable ? "border-success bg-card" : "border-change bg-change-surface"}`}
      >
        <div className="flex items-center gap-3">
          {job.workspaceAvailable ? (
            <CheckCircle2 className="size-6 text-success" />
          ) : (
            <AlertTriangle className="size-6 text-change" />
          )}
          <div className="flex-1">
            <h2 className="text-lg font-bold">Workspace</h2>
            <p className="text-sm font-semibold text-muted-foreground">
              {job.workspaceAvailable ? "Workspace available" : "Workspace not available"}
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            role="switch"
            aria-checked={job.workspaceAvailable}
            onClick={() =>
              void save(() => updateWorkspaceAvailability(job.id, !job.workspaceAvailable))
            }
            className={`min-h-tap rounded-2xl px-4 text-sm font-bold ${job.workspaceAvailable ? "bg-success text-success-foreground" : "bg-change text-change-foreground"}`}
          >
            {job.workspaceAvailable ? "Available" : "Not available"}
          </button>
        </div>
      </section>

      <section
        className={`rounded-3xl border-2 p-5 ${summary.ready ? "border-success bg-card" : "border-change bg-change-surface"}`}
        aria-live="polite"
      >
        <p className="text-lg font-bold">{summary.ready ? "Ready to work" : "Not ready yet"}</p>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          {summary.ready
            ? "All checks are complete."
            : `${summary.checkedItems} of ${summary.totalItems} items confirmed${summary.missingItems ? ` · ${summary.missingItems} missing` : ""}.`}
        </p>
        <FieldButton
          className="mt-4"
          variant={summary.ready ? "success" : "change"}
          disabled={!summary.ready || saving || job.status === "ready"}
          onClick={() => void save(() => markJobReady(job.id))}
        >
          {job.status === "ready" ? (
            <>
              <CheckCircle2 className="size-6" /> Ready confirmed
            </>
          ) : (
            <>
              <ClipboardCheck className="size-6" /> Mark job ready
            </>
          )}
        </FieldButton>
      </section>
      {error && (
        <p
          role="alert"
          className="rounded-2xl border-2 border-change bg-change-surface p-4 font-semibold text-change-foreground"
        >
          {error}
        </p>
      )}
    </AppShell>
  );
}
