import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Mic, Plus, Save, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/field/AppShell";
import { FieldButton } from "@/components/field/FieldButton";
import { FieldLabel, TextArea, TextInput, fieldControlClass } from "@/components/field/inputs";
import { REPORT_PROBLEM_TAGS, technicianName, type Job } from "@/data/jobs";
import { reportSubmissionReady, type JobReport, type ReportDraftInput } from "@/data/store";
import { useTechnician } from "@/state/technician";

type SaveState = "idle" | "saving" | "saved" | "error";

function jobStartTime(timeslot: string): string {
  return timeslot.match(/·\s*(\d{2}:\d{2})/)?.[1] ?? "";
}

function currentTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

function draftForJob(job: Job, report?: JobReport): ReportDraftInput {
  return {
    jobId: job.id,
    technicianId: job.technicianId,
    notes: report?.notes ?? "",
    nothingToReport: report?.nothingToReport ?? false,
    problems: report?.problems ?? [],
    materials:
      report?.materials ??
      job.items
        .filter((item) => item.kind === "material")
        .map((item) => ({ name: item.label, used: false, isExtra: false })),
    followUpNeeded: report?.followUpNeeded ?? false,
    followUpText: report?.followUpText ?? "",
    startedAt: report?.startedAt ?? jobStartTime(job.timeslot),
    endedAt: report?.endedAt ?? currentTime(),
  };
}

export const Route = createFileRoute("/job/$jobId_/report")({
  head: () => ({
    meta: [
      { title: "Report — AdvantiQ" },
      { name: "description", content: "Complete the report for this job." },
      { property: "og:title", content: "Report — AdvantiQ" },
      { property: "og:description", content: "Complete the report for this job." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportScreen,
});

function ReportScreen() {
  const { jobId } = Route.useParams();
  const {
    technicianId,
    hydrated,
    getJob,
    getReport,
    saveReportDraft,
    submitReport,
  } = useTechnician();
  const job = getJob(jobId);
  const report = getReport(jobId);
  const [form, setForm] = useState<ReportDraftInput | null>(null);
  const [extraMaterial, setExtraMaterial] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<JobReport>();
  const saveVersion = useRef(0);
  const autosaveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (job && form === null && hydrated) setForm(draftForJob(job, report));
  }, [form, hydrated, job, report]);

  const readOnly = submittedReport !== undefined || report?.status === "submitted" || report?.status === "reviewed";
  const canEdit = job?.technicianId === technicianId && !job?.cancellation;
  const canSubmit = Boolean(form && reportSubmissionReady(form));
  const reportStatus = submittedReport?.status ?? report?.status;
  const dateLabel = useMemo(() => new Date().toLocaleDateString("en-GB"), []);

  async function saveDraft(nextForm = form) {
    if (!nextForm || readOnly) return;
    const version = saveVersion.current + 1;
    saveVersion.current = version;
    setSaveState("saving");
    try {
      await saveReportDraft(nextForm);
      if (version === saveVersion.current) setSaveState("saved");
    } catch {
      if (version === saveVersion.current) setSaveState("error");
    }
  }

  useEffect(() => {
    if (!form || readOnly || !canEdit) return;
    autosaveTimer.current = window.setTimeout(() => void saveDraft(form), 900);
    return () => {
      if (autosaveTimer.current !== undefined) window.clearTimeout(autosaveTimer.current);
    };
  }, [form, readOnly, canEdit]);

  if (!job && !hydrated) return <AppShell title="Loading report…" />;
  if (!job) throw notFound();

  if (!canEdit) {
    return (
      <AppShell title="Report" eyebrow={job.id} bottom={<BackToJob jobId={job.id} />}>
        <section className="space-y-3 rounded-3xl border border-border bg-card p-5 text-center">
          <h2 className="font-display text-xl">Report unavailable</h2>
          <p className="text-muted-foreground">Only the assigned technician can complete this report.</p>
        </section>
      </AppShell>
    );
  }

  if (!form) return <AppShell title="Loading report…" eyebrow={job.id} />;

  async function confirmSubmit() {
    setSubmitConfirm(false);
    if (autosaveTimer.current !== undefined) window.clearTimeout(autosaveTimer.current);
    saveVersion.current += 1;
    setSaveState("saving");
    try {
      const submitted = await submitReport(form);
      setSubmittedReport(submitted);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  function updateForm(update: (current: ReportDraftInput) => ReportDraftInput) {
    setForm((current) => (current ? update(current) : current));
    setSaveState("idle");
  }

  function toggleProblem(tag: string) {
    updateForm((current) => ({
      ...current,
      problems: current.problems.some((problem) => problem.tag === tag)
        ? current.problems.filter((problem) => problem.tag !== tag)
        : [...current.problems, { tag }],
    }));
  }

  function updateProblemNote(tag: string, note: string) {
    updateForm((current) => ({
      ...current,
      problems: current.problems.map((problem) => (problem.tag === tag ? { ...problem, note } : problem)),
    }));
  }

  function addExtraMaterial() {
    const name = extraMaterial.trim();
    if (!name) return;
    updateForm((current) => ({
      ...current,
      materials: [...current.materials, { name, used: false, isExtra: true }],
    }));
    setExtraMaterial("");
  }

  return (
    <AppShell title="Report" eyebrow={job.id} wide bottom={<BackToJob jobId={job.id} />}>
      {submittedReport && (
        <section className="flex items-center gap-3 rounded-2xl border-2 border-success bg-card p-4" aria-live="polite">
          <CheckCircle2 className="size-6 shrink-0 text-success" />
          <p className="font-bold">Report submitted. This job is now marked done.</p>
        </section>
      )}
      <section className="grid gap-3 rounded-3xl border border-border bg-card p-5 sm:grid-cols-3">
        <Info label="Job" value={`${job.id} · ${job.project}`} />
        <Info label="Technician" value={technicianName(job.technicianId)} />
        <Info label="Date" value={dateLabel} />
      </section>

      <fieldset disabled={readOnly} className="space-y-6 disabled:opacity-100">
        <section className="space-y-2">
          <FieldLabel>What did you do?</FieldLabel>
          <TextArea
            value={form.notes}
            onChange={(event) => updateForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Describe the work completed"
          />
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mic className="size-4" /> Tip: tap the microphone on your keyboard to dictate.
          </p>
        </section>

        <section className="space-y-3">
          <FieldLabel>Problems found</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {REPORT_PROBLEM_TAGS.map((tag) => {
              const selected = form.problems.some((problem) => problem.tag === tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={selected}
                  className={`min-h-12 rounded-full border px-4 text-left text-sm font-bold ${selected ? "border-change-border bg-change-fill" : "border-border bg-card"}`}
                  onClick={() => toggleProblem(tag)}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          {form.problems.map((problem) => (
            <TextInput
              key={problem.tag}
              value={problem.note ?? ""}
              onChange={(event) => updateProblemNote(problem.tag, event.target.value)}
              placeholder={`${problem.tag}: optional note`}
              aria-label={`${problem.tag} note`}
            />
          ))}
        </section>

        <section className="space-y-3">
          <FieldLabel>Materials used</FieldLabel>
          {form.materials.map((material, index) => (
            <div key={`${material.name}-${index}`} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <span className="min-w-0 flex-1 font-semibold">{material.name}</span>
              <button
                type="button"
                className={`min-h-11 rounded-xl px-3 text-sm font-bold ${material.used ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}
                onClick={() =>
                  updateForm((current) => ({
                    ...current,
                    materials: current.materials.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, used: !item.used } : item,
                    ),
                  }))
                }
              >
                {material.used ? "Used" : "Not used"}
              </button>
              {material.isExtra && (
                <button
                  type="button"
                  aria-label={`Remove ${material.name}`}
                  className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground"
                  onClick={() =>
                    updateForm((current) => ({
                      ...current,
                      materials: current.materials.filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                >
                  <X className="size-5" />
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <TextInput
              value={extraMaterial}
              onChange={(event) => setExtraMaterial(event.target.value)}
              placeholder="Other material"
              aria-label="Other material"
            />
            <FieldButton type="button" variant="tile" className="w-auto shrink-0 flex-row px-4" onClick={addExtraMaterial}>
              <Plus className="size-5" /> Add
            </FieldButton>
          </div>
        </section>

        <section className="space-y-3">
          <label className="flex min-h-tap items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <input
              type="checkbox"
              className="size-6 accent-success"
              checked={form.followUpNeeded}
              onChange={(event) =>
                updateForm((current) => ({ ...current, followUpNeeded: event.target.checked }))
              }
            />
            <span className="font-bold">Follow-up needed</span>
          </label>
          {form.followUpNeeded && (
            <TextInput
              value={form.followUpText ?? ""}
              onChange={(event) => updateForm((current) => ({ ...current, followUpText: event.target.value }))}
              placeholder="What needs to happen next?"
            />
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <label>
            <FieldLabel>Start time</FieldLabel>
            <input
              className={fieldControlClass}
              type="time"
              value={form.startedAt ?? ""}
              onChange={(event) => updateForm((current) => ({ ...current, startedAt: event.target.value }))}
            />
          </label>
          <label>
            <FieldLabel>End time</FieldLabel>
            <input
              className={fieldControlClass}
              type="time"
              value={form.endedAt ?? ""}
              onChange={(event) => updateForm((current) => ({ ...current, endedAt: event.target.value }))}
            />
          </label>
        </section>

        <label className="flex min-h-tap items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <input
            type="checkbox"
            className="size-6 accent-success"
            checked={form.nothingToReport}
            onChange={(event) =>
              updateForm((current) => ({ ...current, nothingToReport: event.target.checked }))
            }
          />
          <span className="font-bold">Nothing to report</span>
        </label>
      </fieldset>

      {readOnly ? (
        <section className="rounded-2xl border border-success bg-card p-4 text-center">
          <p className="font-bold">This report is {reportStatus} and cannot be edited.</p>
        </section>
      ) : (
        <section className="space-y-3">
          {submitConfirm && (
            <div className="space-y-3 rounded-2xl border-2 border-change-border bg-change-surface p-4">
              <p className="font-bold">Submit this report and mark the job done?</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <FieldButton variant="success" onClick={() => void confirmSubmit()}>
                  <Send className="size-5" /> Confirm submit
                </FieldButton>
                <FieldButton variant="tile" onClick={() => setSubmitConfirm(false)}>
                  Cancel
                </FieldButton>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <button type="button" className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-muted-foreground" onClick={() => void saveDraft()}>
              <Save className="size-4" /> Save draft
            </button>
            <span className="text-sm font-semibold text-muted-foreground" aria-live="polite">
              {saveState === "saving" && "Saving…"}
              {saveState === "saved" && "Saved"}
              {saveState === "error" && "Not saved, retry"}
            </span>
          </div>
          <FieldButton disabled={!canSubmit || submitConfirm} onClick={() => setSubmitConfirm(true)}>
            <Send className="size-6" /> Submit report
          </FieldButton>
        </section>
      )}
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-semibold">{value}</dd>
    </div>
  );
}

function BackToJob({ jobId }: { jobId: string }) {
  return (
    <FieldButton asChild variant="tile" className="min-h-tap flex-row text-base">
      <Link to="/job/$jobId" params={{ jobId }}>
        <ArrowLeft className="size-6" /> Back to job
      </Link>
    </FieldButton>
  );
}
