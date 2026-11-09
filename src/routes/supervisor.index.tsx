import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/field/AppShell";
import { FieldButton } from "@/components/field/FieldButton";
import { FieldLabel, FieldSelect } from "@/components/field/inputs";
import { JobCard } from "@/components/field/JobCard";
import { technicians } from "@/data/jobs";
import { useTechnician } from "@/state/technician";

export const Route = createFileRoute("/supervisor/")({
  head: () => ({
    meta: [
      { title: "Supervisor jobs — AdvantiQ" },
      {
        name: "description",
        content: "Manage technician assignments and job updates in the AdvantiQ prototype.",
      },
      { property: "og:title", content: "Supervisor jobs — AdvantiQ" },
      {
        property: "og:description",
        content: "Manage technician assignments and job updates in the AdvantiQ prototype.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupervisorJobs,
});

function SupervisorJobs() {
  const { jobs, openUpdate, resetDemo } = useTechnician();
  const [technician, setTechnician] = useState("all");
  const [status, setStatus] = useState("all");
  const [confirmReset, setConfirmReset] = useState(false);
  const filtered = jobs.filter(
    (job) =>
      (technician === "all" || job.technicianId === technician) &&
      (status === "all" ||
        (status === "updated" ? Boolean(openUpdate(job)) : job.status === status)),
  );
  return (
    <AppShell
      title="All jobs"
      eyebrow="Supervisor"
      wide
      bottom={
        <FieldButton asChild variant="tile" className="flex-row text-base">
          <Link to="/">
            <ArrowLeft className="size-6" />
            Technician view
          </Link>
        </FieldButton>
      }
    >
      <FieldButton asChild>
        <Link to="/supervisor/new">
          <Plus className="size-6" />
          New job
        </Link>
      </FieldButton>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <FieldLabel>Technician</FieldLabel>
          <FieldSelect value={technician} onChange={(e) => setTechnician(e.target.value)}>
            <option value="all">All technicians</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name}
              </option>
            ))}
          </FieldSelect>
        </label>
        <label>
          <FieldLabel>Status</FieldLabel>
          <FieldSelect value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="updated">Updated</option>
            <option value="not-started">Not started</option>
            <option value="ready">Ready</option>
            <option value="done">Done</option>
          </FieldSelect>
        </label>
      </div>
      <section className="grid gap-3 sm:grid-cols-2">
        {filtered.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            status={openUpdate(job) ? "updated" : job.status}
            detailPath="/supervisor/job/$jobId"
          />
        ))}
      </section>
      {filtered.length === 0 && (
        <p className="py-5 text-center text-muted-foreground">No matching jobs</p>
      )}
      {confirmReset ? (
        <section className="space-y-3 border-t border-border pt-5" aria-label="Reset confirmation">
          <p className="font-bold">
            Reset all jobs to the original demo? Your changes will be removed.
          </p>
          <FieldButton
            variant="change"
            onClick={async () => {
              await resetDemo();
              setConfirmReset(false);
            }}
          >
            Reset now
          </FieldButton>
          <FieldButton variant="tile" onClick={() => setConfirmReset(false)}>
            Cancel
          </FieldButton>
        </section>
      ) : (
        <FieldButton
          variant="tile"
          className="flex-row text-base"
          onClick={() => setConfirmReset(true)}
        >
          <RotateCcw className="size-5" />
          Reset demo data
        </FieldButton>
      )}
    </AppShell>
  );
}
