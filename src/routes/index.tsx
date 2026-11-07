import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { JobCard, type DisplayStatus } from "@/components/field/JobCard";
import { UpdateBanner } from "@/components/field/UpdateBanner";
import { technicians, type Job } from "@/data/jobs";
import { useTechnician } from "@/state/technician";

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

function displayStatus(job: Job, hasOpenUpdate: boolean): DisplayStatus {
  if (hasOpenUpdate) return "updated";
  return job.status;
}

function HomeScreen() {
  const { technicianId, setTechnicianId, jobs, openUpdate } = useTechnician();
  const navigate = useNavigate();
  const myJobs = jobs.filter((j) => j.technicianId === technicianId);
  const updatedJob = myJobs.find((j) => openUpdate(j));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <div className="hazard-stripe h-2" aria-hidden />
      <header className="px-gutter pb-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-lg tracking-widest text-primary">ADVANTIQ</span>
          <label className="relative flex items-center">
            <span className="sr-only">Choose technician or supervisor</span>
            <select
              value={technicianId}
              onChange={(e) => {
                if (e.target.value === "supervisor") {
                  navigate({ to: "/supervisor" });
                } else {
                  setTechnicianId(e.target.value);
                }
              }}
              className="min-h-tap appearance-none rounded-2xl bg-secondary py-2 pl-4 pr-10 text-base font-bold text-secondary-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
            >
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
              <option value="supervisor">Supervisor</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 size-5 text-muted-foreground" aria-hidden />
          </label>
        </div>
      </header>

      <main className="flex-1 space-y-5 px-gutter pb-6">
        {updatedJob ? (
          <UpdateBanner job={updatedJob} />
        ) : (
          <p className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm font-semibold text-muted-foreground">
            <CheckCircle2 className="size-5 text-success" /> No new updates
          </p>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">My jobs</h2>
          {myJobs.map((job) => (
            <JobCard key={job.id} job={job} status={displayStatus(job, Boolean(openUpdate(job)))} />
          ))}
        </section>
      </main>
    </div>
  );
}
