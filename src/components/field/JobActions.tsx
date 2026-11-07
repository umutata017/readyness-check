import { Link } from "@tanstack/react-router";
import { ClipboardCheck, Mic, Navigation, Phone } from "lucide-react";
import { SUPERVISOR_PHONE, type Job } from "@/data/jobs";
import { FieldButton } from "@/components/field/FieldButton";

/** Big glove-friendly action buttons for the job detail screen. */
export function JobActions({ job }: { job: Job }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        <FieldButton asChild variant="tile">
          <a href={mapsUrl} target="_blank" rel="noreferrer">
            <Navigation className="size-6" />Route
          </a>
        </FieldButton>
        <FieldButton asChild variant="tile">
          <a href={`tel:${SUPERVISOR_PHONE}`}>
            <Phone className="size-6" />Supervisor
          </a>
        </FieldButton>
      </div>
      <FieldButton asChild>
        <Link to="/job/$jobId/ready-check" params={{ jobId: job.id }}>
          <ClipboardCheck className="size-6" />Ready check
        </Link>
      </FieldButton>
      <FieldButton asChild variant="change">
        <Link to="/job/$jobId/report" params={{ jobId: job.id }}>
          <Mic className="size-6" />Report
        </Link>
      </FieldButton>
    </section>
  );
}
