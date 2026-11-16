import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Agenda } from "@/components/field/Agenda";
import { AppShell } from "@/components/field/AppShell";
import { FieldButton } from "@/components/field/FieldButton";
import { FieldLabel, FieldSelect } from "@/components/field/inputs";
import { RoleSwitcher } from "@/components/field/RoleSwitcher";
import { technicians } from "@/data/jobs";
import { startOfWeek } from "@/data/planning";
import { displayStatus } from "@/data/store";
import { useTechnician } from "@/state/technician";

export const Route = createFileRoute("/supervisor/planning")({
  head: () => ({
    meta: [
      { title: "Planning — AdvantiQ" },
      { name: "description", content: "Week planning for all technicians, with double bookings flagged." },
    ],
  }),
  component: SupervisorPlanning,
});

function SupervisorPlanning() {
  const { jobs, openUpdate } = useTechnician();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [technician, setTechnician] = useState("all");
  const shown = jobs.filter((job) => technician === "all" || job.technicianId === technician);

  return (
    <AppShell
      title="Planning"
      wide
      headerRight={<RoleSwitcher supervisor />}
      bottom={
        <FieldButton asChild variant="tile" className="min-h-tap flex-row text-base">
          <Link to="/supervisor">
            <ArrowLeft className="size-6" /> Back to all jobs
          </Link>
        </FieldButton>
      }
    >
      <label className="block">
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
      <Agenda
        jobs={shown}
        weekStart={weekStart}
        onWeekChange={setWeekStart}
        statusOf={(job) => displayStatus(job, Boolean(openUpdate(job)))}
        detailPath="/supervisor/job/$jobId"
        supervisor
      />
    </AppShell>
  );
}
