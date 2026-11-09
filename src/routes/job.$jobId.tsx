import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  User,
} from "lucide-react";
import { AppShell } from "@/components/field/AppShell";
import { FieldButton } from "@/components/field/FieldButton";
import { JobActions } from "@/components/field/JobActions";
import { openEntries } from "@/data/store";
import { useTechnician } from "@/state/technician";

export const Route = createFileRoute("/job/$jobId")({
  head: ({ params }) => ({
    meta: [
      { title: `Job ${params.jobId} — AdvantiQ` },
      {
        name: "description",
        content: "Job details, tasks and latest changes for the on-site technician.",
      },
      { property: "og:title", content: `Job ${params.jobId} — AdvantiQ` },
      {
        property: "og:description",
        content: "Job details, tasks and latest changes for the on-site technician.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JobDetail,
});

function JobDetail() {
  const { jobId } = Route.useParams();
  const { getJob, markUpdateSeen, hydrated } = useTechnician();
  const job = getJob(jobId);
  if (!job && !hydrated) return <AppShell title="Loading job…" />;
  if (!job) throw notFound();

  const open = openEntries(job);
  const seen = open.length === 0;
  const changedTaskIds = new Set(open.map((e) => e.taskId).filter(Boolean));
  const latest = job.history.at(-1);

  return (
    <AppShell
      title={job.project}
      eyebrow={job.id}
      bottom={
        <FieldButton asChild variant="tile" className="min-h-tap flex-row text-base">
          <Link to="/">
            <ArrowLeft className="size-6" /> Back to my jobs
          </Link>
        </FieldButton>
      }
    >
      <section className="space-y-3 rounded-3xl bg-card p-5 text-lg">
        <Info icon={<User className="size-5" />} text={job.customer} />
        <Info icon={<MapPin className="size-5" />} text={job.address} />
        <Info icon={<Clock className="size-5" />} text={job.timeslot} strong />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
          Tasks
        </h2>
        <ol className="space-y-2">
          {job.tasks.map((t, i) => (
            <li
              key={t.id}
              className={
                changedTaskIds.has(t.id)
                  ? "flex items-center gap-4 rounded-2xl border-2 border-change bg-change-surface p-4"
                  : "flex items-center gap-4 rounded-2xl bg-card p-4"
              }
            >
              <span
                className={
                  changedTaskIds.has(t.id)
                    ? "grid size-9 shrink-0 place-items-center rounded-full bg-change font-bold text-change-foreground"
                    : "grid size-9 shrink-0 place-items-center rounded-full bg-secondary font-bold"
                }
              >
                {i + 1}
              </span>
              <span className="text-lg font-semibold leading-snug">{t.label}</span>
              {changedTaskIds.has(t.id) && (
                <AlertTriangle
                  className="ml-auto size-6 shrink-0 text-change"
                  aria-label="Changed"
                />
              )}
            </li>
          ))}
        </ol>
      </section>

      {(open.length > 0 || latest) && (
        <section
          className={
            seen
              ? "rounded-3xl border-2 border-success bg-card p-5"
              : "rounded-3xl border-2 border-change bg-change-surface p-5"
          }
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            {seen ? (
              <CheckCircle2 className="size-6 text-success" />
            ) : (
              <AlertTriangle className="size-6 text-change" />
            )}
            <h2 className="font-display text-xl">{seen ? "Update confirmed" : "Update"}</h2>
          </div>
          {(seen ? (latest ? [latest] : []) : open).map((u) => (
            <div key={u.id} className="mt-3">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {u.field}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-lg font-bold">
                {u.oldValue && (
                  <span className="text-muted-foreground line-through">{u.oldValue}</span>
                )}
                {u.oldValue && <ArrowRight className="size-5" />}
                <span className={seen ? "text-foreground" : "text-change-foreground"}>
                  {u.newValue}
                </span>
              </div>
              {u.message && (
                <p className="mt-1 text-base font-semibold text-muted-foreground">“{u.message}”</p>
              )}
            </div>
          ))}
          {!seen && (
            <FieldButton
              className="mt-5"
              variant="primary"
              onClick={() => void markUpdateSeen(job.id)}
            >
              Seen
            </FieldButton>
          )}
          {seen && (
            <FieldButton className="mt-5" variant="success" disabled>
              <CheckCircle2 className="size-6" /> Seen
            </FieldButton>
          )}
        </section>
      )}

      <JobActions job={job} />
    </AppShell>
  );
}

function Info({ icon, text, strong }: { icon: React.ReactNode; text: string; strong?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-primary">{icon}</span>
      <span className={strong ? "font-bold text-primary" : "font-semibold"}>{text}</span>
    </div>
  );
}
