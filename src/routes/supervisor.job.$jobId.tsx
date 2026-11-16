import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Mic, Pencil } from "lucide-react";
import { AppShell } from "@/components/field/AppShell";
import { FieldButton } from "@/components/field/FieldButton";
import { CancelNotice } from "@/components/field/CancelNotice";
import { JobHistory } from "@/components/field/JobHistory";
import { RemoveJobPanel } from "@/components/field/RemoveJobPanel";
import { technicianName } from "@/data/jobs";
import { formatTime, openEntries } from "@/data/store";
import { useTechnician } from "@/state/technician";

export const Route = createFileRoute("/supervisor/job/$jobId")({
  head: ({ params }) => ({ meta: [
    { title: `Supervisor job ${params.jobId} — AdvantiQ` }, { name: "description", content: "Job details, requirements and technician update acknowledgements." },
    { property: "og:title", content: `Supervisor job ${params.jobId} — AdvantiQ` }, { property: "og:description", content: "Job details, requirements and technician update acknowledgements." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: SupervisorJob,
});
function SupervisorJob() {
  const { jobId } = Route.useParams();
  const { getJob, getReport, markReportReviewed, hydrated } = useTechnician();
  const job = getJob(jobId);
  if (!job && !hydrated) return <AppShell title="Loading job…" wide />;
  if (!job) throw notFound();
  const updates = openEntries(job);
  const changed = new Set(updates.map((entry) => entry.taskId));
  const report = getReport(job.id);
  return <AppShell title={job.project} eyebrow={job.id} wide bottom={<FieldButton asChild variant="tile" className="flex-row text-base"><Link to="/supervisor"><ArrowLeft className="size-6" />Back to all jobs</Link></FieldButton>}>
    {job.cancellation ? <CancelNotice cancellation={job.cancellation} /> : <FieldButton asChild><Link to="/supervisor/job/$jobId/edit" params={{ jobId }}><Pencil className="size-6" />Edit job</Link></FieldButton>}
    <dl className="grid gap-3 border-y border-border py-4 sm:grid-cols-2">{[["Customer", job.customer], ["Address", job.address], ["Timeslot", job.timeslot], ["Job type", job.jobType], ["Assigned technician", technicianName(job.technicianId)], ["Status", job.cancellation ? "Cancelled" : job.status === "not-started" ? "Not started" : job.status === "ready" ? "Ready" : "Done"]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-sm font-bold text-muted-foreground">{label}</dt><dd className="break-words text-lg font-semibold">{value}</dd></div>)}</dl>
    <section><h2 className="mb-3 text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Tasks</h2><ol className="space-y-2">{job.tasks.map((task, i) => <li key={task.id} className={`flex items-center gap-3 rounded-2xl p-4 font-semibold ${changed.has(task.id) ? "border-2 border-change-border bg-change-surface" : "border border-border bg-card"}`}><span className="font-bold">{i + 1}</span><span className="min-w-0 break-words">{task.label}</span>{changed.has(task.id) && <AlertTriangle className="ml-auto size-5 shrink-0 text-change" />}</li>)}</ol></section>
    {updates.length > 0 && <section className="space-y-3 border-l-4 border-change-border pl-4"><h2 className="font-display text-xl text-change">Update</h2>{updates.map((entry) => <div key={entry.id}><p className="text-sm font-bold text-muted-foreground">{entry.field}</p><p className="flex flex-wrap items-center gap-2 font-bold">{entry.oldValue && <><span className="text-muted-foreground line-through">{entry.oldValue}</span><ArrowRight className="size-4" /></>}<span>{entry.newValue}</span></p>{entry.message && <p className="text-muted-foreground">“{entry.message}”</p>}</div>)}<p className="text-sm font-bold text-change">Not seen yet</p></section>}
    <section><h2 className="mb-3 text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Required items</h2><ul className="divide-y divide-border">{job.items.map((item) => <li key={item.id} className="flex flex-wrap justify-between gap-2 py-3 font-semibold"><span>{item.label}</span><span className="text-sm capitalize text-muted-foreground">{item.kind}</span></li>)}</ul><p className={`mt-3 flex items-center gap-2 font-bold ${job.workspaceAvailable ? "text-success" : "text-change"}`}>{job.workspaceAvailable ? <CheckCircle2 className="size-5" /> : <AlertTriangle className="size-5" />}Workspace {job.workspaceAvailable ? "available" : "not available"}</p></section>
    <JobHistory job={job} />
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Report</h2>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${report ? report.status === "reviewed" ? "bg-success text-success-foreground" : "bg-change-fill text-change-foreground" : "bg-muted text-muted-foreground"}`}>
          {report?.status ?? "No report"}
        </span>
      </div>
      {!report && <p className="text-muted-foreground">No report has been started for this job.</p>}
      {report && (
        <div className="space-y-4 rounded-3xl border border-border bg-card p-5">
          {report.status !== "reviewed" && (
            <p className="flex items-center gap-2 font-bold text-change-foreground">
              <AlertTriangle className="size-5" /> New report
            </p>
          )}
          <div>
            <p className="text-sm font-bold text-muted-foreground">What was done</p>
            <p className="mt-1 whitespace-pre-wrap font-semibold">{report.notes || "Nothing recorded."}</p>
          </div>
          {report.nothingToReport && <p className="font-bold text-success">Nothing to report</p>}
          {report.problems.length > 0 && (
            <div>
              <p className="text-sm font-bold text-muted-foreground">Problems found</p>
              <ul className="mt-1 space-y-1">
                {report.problems.map((problem) => <li key={problem.tag} className="font-semibold">{problem.tag}{problem.note && ` — ${problem.note}`}</li>)}
              </ul>
            </div>
          )}
          {report.materials.length > 0 && (
            <div>
              <p className="text-sm font-bold text-muted-foreground">Materials</p>
              <ul className="mt-1 space-y-1">
                {report.materials.map((material) => <li key={`${material.name}-${material.isExtra}`} className="font-semibold">{material.name}: {material.used ? "Used" : "Not used"}</li>)}
              </ul>
            </div>
          )}
          {report.followUpNeeded && <p className="font-semibold">Follow-up: {report.followUpText || "Needed"}</p>}
          {(report.startedAt || report.endedAt) && <p className="font-semibold">Time: {report.startedAt || "—"} to {report.endedAt || "—"}</p>}
          <p className="text-sm text-muted-foreground">
            {report.submittedAt ? `Submitted ${formatTime(report.submittedAt)}` : "Draft saved"}
            {report.reviewedAt && ` · Reviewed ${formatTime(report.reviewedAt)}`}
          </p>
          {report.status === "submitted" && (
            <FieldButton variant="success" onClick={() => void markReportReviewed(report.id)}>
              <CheckCircle2 className="size-5" /> Mark as reviewed
            </FieldButton>
          )}
        </div>
      )}
    </section>
    <div className="grid gap-3 sm:grid-cols-2"><FieldButton variant="tile" disabled><ClipboardCheck className="size-6" />Ready check · Not available yet</FieldButton><FieldButton variant="tile" disabled><Mic className="size-6" />Report · Technician only</FieldButton></div>
    {!job.cancellation && <RemoveJobPanel jobId={job.id} />}
  </AppShell>;
}