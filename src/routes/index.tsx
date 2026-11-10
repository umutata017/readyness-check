import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/field/AppShell";
import { JobCard } from "@/components/field/JobCard";
import { RoleSwitcher } from "@/components/field/RoleSwitcher";
import { UpdateBanner } from "@/components/field/UpdateBanner";
import { displayStatus } from "@/data/store";
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

function HomeScreen() {
  const { technicianId, jobs, openUpdate } = useTechnician();
  const myJobs = jobs.filter((j) => j.technicianId === technicianId);
  const updatedJob = myJobs.find((j) => !j.cancellation && openUpdate(j));

  return (
    <AppShell title="My jobs" wide headerRight={<RoleSwitcher />}>
      {updatedJob ? (
        <UpdateBanner job={updatedJob} />
      ) : (
        <p className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground">
          <CheckCircle2 className="size-5 text-success" /> No new updates
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        {myJobs.map((job) => (
          <JobCard key={job.id} job={job} status={displayStatus(job, Boolean(openUpdate(job)))} />
        ))}
      </section>
    </AppShell>
  );
}
