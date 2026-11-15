import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, RotateCcw, Search } from "lucide-react";
import { AppShell } from "@/components/field/AppShell";
import { FieldButton } from "@/components/field/FieldButton";
import { FieldLabel, FieldSelect, TextInput } from "@/components/field/inputs";
import { JobCard } from "@/components/field/JobCard";
import { RoleSwitcher } from "@/components/field/RoleSwitcher";
import { technicians } from "@/data/jobs";
import { displayStatus, matchesJobSearch } from "@/data/store";
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
  const [search, setSearch] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const filtered = jobs.filter(
    (job) =>
      matchesJobSearch(job, search) &&
      (technician === "all" || job.technicianId === technician) &&
      (status === "all" || displayStatus(job, Boolean(openUpdate(job))) === status),
  );
  return (
    <AppShell
      title="All jobs"
      wide
      headerRight={<RoleSwitcher supervisor />}
    >
      <FieldButton asChild>
        <Link to="/supervisor/new">
          <Plus className="size-6" />
          New job
        </Link>
      </FieldButton>
      <label className="block">
        <FieldLabel>Find a job</FieldLabel>
        <span className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <TextInput
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Job number (e.g. J26-0042), customer or address"
            className="pl-12"
          />
        </span>
      </label>
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
            <option value="cancelled">Cancelled</option>
          </FieldSelect>
        </label>
      </div>
      <section className="grid gap-3 sm:grid-cols-2">
        {filtered.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            status={displayStatus(job, Boolean(openUpdate(job)))}
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
