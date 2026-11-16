import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/field/AppShell";
import { FieldButton } from "@/components/field/FieldButton";
import { FieldSelect, TextInput } from "@/components/field/inputs";
import { JobCard } from "@/components/field/JobCard";
import { RoleSwitcher } from "@/components/field/RoleSwitcher";
import { UpdateBanner } from "@/components/field/UpdateBanner";
import { displayStatus, filterTechnicianJobs, type DisplayStatus } from "@/data/store";
import { JOB_TYPES } from "@/data/jobs";
import { useTechnician } from "@/state/technician";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My jobs — AdvantiQ" },
      { name: "description", content: "Today's jobs and updates for the on-site technician." },
      { property: "og:title", content: "My jobs — AdvantiQ" },
      { property: "og:description", content: "Today's jobs and updates for the on-site technician." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomeScreen,
});

function HomeScreen() {
  const { technicianId, jobs, openUpdate } = useTechnician();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DisplayStatus | "all">("all");
  const [jobType, setJobType] = useState("all");
  const [sort, setSort] = useState<"default" | "project">("default");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const myJobs = jobs.filter((j) => j.technicianId === technicianId);
  const updatedJob = myJobs.find((j) => !j.cancellation && openUpdate(j));
  const filteredJobs = filterTechnicianJobs(myJobs, (job) => Boolean(openUpdate(job)), {
    search,
    status,
    jobType,
    sort,
  });
  const filtersActive = Boolean(search || status !== "all" || jobType !== "all" || sort !== "default");
  const activeFilterCount = [status !== "all", jobType !== "all", sort !== "default"].filter(Boolean).length;

  function resetFilters() {
    setSearch("");
    setStatus("all");
    setJobType("all");
    setSort("default");
  }

  return (
    <AppShell title="My jobs" wide headerRight={<RoleSwitcher />}>
      <FieldButton asChild variant="tile" className="min-h-tap flex-row text-base">
        <Link to="/planning">
          <CalendarDays className="size-5" />
          Week planning
        </Link>
      </FieldButton>
      {updatedJob ? (
        <UpdateBanner job={updatedJob} />
      ) : (
        <p className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground">
          <CheckCircle2 className="size-5 text-success" /> No new updates
        </p>
      )}

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
            aria-controls="job-filters"
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
          <div id="job-filters" className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
            <label>
              <span className="sr-only">Status</span>
              <FieldSelect aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value as DisplayStatus | "all")}>
                <option value="all">All statuses</option>
                <option value="updated">Updated</option>
                <option value="not-started">Not started</option>
                <option value="ready">Ready</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </FieldSelect>
            </label>
            <label>
              <span className="sr-only">Job type</span>
              <FieldSelect aria-label="Job type" value={jobType} onChange={(event) => setJobType(event.target.value)}>
                <option value="all">All job types</option>
                {JOB_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </FieldSelect>
            </label>
            <label className="col-span-2 sm:col-span-1">
              <span className="sr-only">Sort</span>
              <FieldSelect aria-label="Sort" value={sort} onChange={(event) => setSort(event.target.value as "default" | "project")}>
                <option value="default">Default order</option>
                <option value="project">Project A–Z</option>
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
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} status={displayStatus(job, Boolean(openUpdate(job)))} />
        ))}
      </section>
      {filteredJobs.length === 0 && (
        <p className="py-5 text-center text-muted-foreground">No matching jobs</p>
      )}
    </AppShell>
  );
}
