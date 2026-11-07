import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, ClipboardCheck, MapPin, Navigation, Phone, User } from "lucide-react";
import { AppShell } from "@/components/field/AppShell";
import { FieldButton } from "@/components/field/FieldButton";
import { currentJob } from "@/data/job";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Job overview — AdvantiQ" },
      { name: "description", content: "Today's job, tasks and latest changes for the on-site technician." },
      { property: "og:title", content: "Job overview — AdvantiQ" },
      { property: "og:description", content: "Today's job, tasks and latest changes for the on-site technician." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JobOverview,
});

function JobOverview() {
  const job = currentJob;
  const [seen, setSeen] = useState(false);
  const u = job.update;

  return (
    <AppShell
      title={job.project}
      eyebrow={job.id}
      bottom={
        <div className="grid grid-cols-3 gap-3">
          <FieldButton variant="tile"><Navigation className="size-6" />Route</FieldButton>
          <FieldButton variant="tile"><ClipboardCheck className="size-6" />Checklist</FieldButton>
          <FieldButton variant="tile"><Phone className="size-6" />Supervisor</FieldButton>
        </div>
      }
    >
      <section className="space-y-3 rounded-3xl bg-card p-5 text-lg">
        <Info icon={<User className="size-5" />} text={job.customer} />
        <Info icon={<MapPin className="size-5" />} text={job.address} />
        <Info icon={<Clock className="size-5" />} text={job.timeslot} strong />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Tasks</h2>
        <ol className="space-y-2">
          {job.tasks.map((t, i) => (
            <li
              key={t.id}
              className={
                t.changed && !seen
                  ? "flex items-center gap-4 rounded-2xl border-2 border-change bg-change-surface p-4"
                  : "flex items-center gap-4 rounded-2xl bg-card p-4"
              }
            >
              <span className={t.changed && !seen ? "grid size-9 shrink-0 place-items-center rounded-full bg-change font-bold text-change-foreground" : "grid size-9 shrink-0 place-items-center rounded-full bg-secondary font-bold"}>{i + 1}</span>
              <span className="text-lg font-semibold leading-snug">{t.label}</span>
              {t.changed && !seen && <AlertTriangle className="ml-auto size-6 shrink-0 text-change" aria-label="Changed" />}
            </li>
          ))}
        </ol>
      </section>

      {u && (
        <section
          className={seen ? "rounded-3xl border-2 border-success bg-card p-5" : "rounded-3xl border-2 border-change bg-change-surface p-5"}
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            {seen ? <CheckCircle2 className="size-6 text-success" /> : <AlertTriangle className="size-6 text-change" />}
            <h2 className="font-display text-xl">{seen ? "Update confirmed" : "Update"}</h2>
          </div>
          <p className="mt-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">{u.field}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-lg font-bold">
            <span className="text-muted-foreground line-through">{u.oldValue}</span>
            <ArrowRight className="size-5" />
            <span className={seen ? "text-foreground" : "text-change-foreground"}>{u.newValue}</span>
          </div>
          <FieldButton className="mt-5" variant={seen ? "success" : "primary"} onClick={() => setSeen(true)} disabled={seen}>
            {seen ? <><CheckCircle2 className="size-6" /> Seen</> : "Seen"}
          </FieldButton>
        </section>
      )}
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
