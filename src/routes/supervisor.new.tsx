import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/field/AppShell";
import { FieldButton } from "@/components/field/FieldButton";
import { JobForm, emptyJobInput } from "@/components/field/JobForm";
import { useTechnician } from "@/state/technician";

export const Route = createFileRoute("/supervisor/new")({
  head: () => ({ meta: [
    { title: "New job — AdvantiQ" }, { name: "description", content: "Create and assign an AdvantiQ technician job." },
    { property: "og:title", content: "New job — AdvantiQ" }, { property: "og:description", content: "Create and assign an AdvantiQ technician job." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: NewJob,
});
function NewJob() {
  const { createJob } = useTechnician();
  const navigate = useNavigate();
  return <AppShell title="New job" eyebrow="Supervisor" wide bottom={<FieldButton asChild variant="tile" className="flex-row text-base"><Link to="/supervisor"><ArrowLeft className="size-6" />Back to all jobs</Link></FieldButton>}>
    <JobForm initial={emptyJobInput} onSave={(input) => { const job = createJob(input); navigate({ to: "/supervisor/job/$jobId", params: { jobId: job.id } }); }} />
  </AppShell>;
}