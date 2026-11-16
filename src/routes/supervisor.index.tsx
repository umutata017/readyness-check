import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/field/AppShell";
import { FieldButton } from "@/components/field/FieldButton";
import { FieldSelect, TextInput } from "@/components/field/inputs";
import { JobCard } from "@/components/field/JobCard";
import { RoleSwitcher } from "@/components/field/RoleSwitcher";
import { technicians } from "@/data/jobs";
import { displayStatus } from "@/data/store";
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
  const [search, setSearch] = useState("");
  const [technician, setTechnician] = useState("all");
  const [status, setStatus] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const filtersActive = Boolean(search || technician !== "all" || status !== "all");
  const activeFilterCount = [technician !== "all", status !== "all"].filter(Boolean).length;
  const filtered = jobs.filter(
    (job) =>
      (!search ||
        `${job.id} ${job.project} ${job.customer} ${job.address}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) &&
      (technician === "all" || job.technicianId === technician) &&
      (status === "all" || displayStatus(job, Boolean(openUpdate(job))) === status),
  );

  function resetFilters() {
    setSearch("");
    setTechnician("all");
    setStatus("all");
  }

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
      <section className="space-y-2" aria-label="Filter jobs">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <TextInput
              className="pl-12"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search jobs"
              aria-label="Search jobs"
              type="search"
            />
          </div>
          <FieldButton
            type="button"
            variant="tile"
            className="min-h-tap w-auto shrink-0 flex-row rounded-2xl px-3 text-sm"
            aria-expanded={filtersOpen}
            aria-controls="supervisor-job-filters"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal className="size-5" aria-hidden />
            <span className="sr-only sm:not-sr-only">Filters</span>
            {activeFilterCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-primary text-xs">{activeFilterCount}</span>
            )}
          </FieldButton>
        </div>
        {filtersOpen && (
          <div id="supervisor-job-filters" className="grid gap-2 pt-1 sm:grid-cols-2">
            <label>
              <span className="sr-only">Technician</span>
              <FieldSelect aria-label="Technician" value={technician} onChange={(e) => setTechnician(e.target.value)}>
                <option value="all">All technicians</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name}
                  </option>
                ))}
              </FieldSelect>
            </label>
            <label>
              <span className="sr-only">Status</span>
              <FieldSelect aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="updated">Updated</option>
                <option value="not-started">Not started</option>
                <option value="ready">Ready</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </FieldSelect>
            </label>
          </div>
        )}
        {filtersActive && (
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-1 px-1 text-sm font-bold text-muted-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={resetFilters}
          >
            <RotateCcw className="size-4" aria-hidden /> Reset filters
          </button>
        )}
      </section>
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
