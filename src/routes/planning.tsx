import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Agenda } from "@/components/field/Agenda";
import { AppShell } from "@/components/field/AppShell";
import { FieldButton } from "@/components/field/FieldButton";
import { RoleSwitcher } from "@/components/field/RoleSwitcher";
import { startOfWeek } from "@/data/planning";
import { displayStatus } from "@/data/store";
import { useTechnician } from "@/state/technician";

export const Route = createFileRoute("/planning")({
  head: () => ({
    meta: [
      { title: "My planning — AdvantiQ" },
      { name: "description", content: "The technician's jobs for the week, day by day." },
    ],
  }),
  component: TechnicianPlanning,
});

function TechnicianPlanning() {
  const { technicianId, jobs, openUpdate } = useTechnician();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const myJobs = jobs.filter((job) => job.technicianId === technicianId);

  return (
    <AppShell
      title="My planning"
      wide
      headerRight={<RoleSwitcher />}
      bottom={
        <FieldButton asChild variant="tile" className="min-h-tap flex-row text-base">
          <Link to="/">
            <ArrowLeft className="size-6" /> Back to my jobs
          </Link>
        </FieldButton>
      }
    >
      <Agenda
        jobs={myJobs}
        weekStart={weekStart}
        onWeekChange={setWeekStart}
        statusOf={(job) => displayStatus(job, Boolean(openUpdate(job)))}
        detailPath="/job/$jobId"
      />
    </AppShell>
  );
}
