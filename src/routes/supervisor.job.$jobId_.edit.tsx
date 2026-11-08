import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/field/AppShell";
import { FieldButton } from "@/components/field/FieldButton";
import { JobForm } from "@/components/field/JobForm";
import { useTechnician } from "@/state/technician";

export const Route = createFileRoute("/supervisor/job/$jobId_/edit")({
  head: ({ params }) => ({ meta: [
    { title: `Edit job ${params.jobId} — AdvantiQ` }, { name: "description", content: "Edit job requirements, reassign technicians and publish updates." },
    { property: "og:title", content: `Edit job ${params.jobId} — AdvantiQ` }, { property: "og:description", content: "Edit job requirements, reassign technicians and publish updates." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: EditJob,
});
function EditJob() {
  const { jobId } = Route.useParams();
  const { getJob, editJob, reassignJob, hydrated } = useTechnician();
  const navigate = useNavigate();
  const job = getJob(jobId);
  if (!hydrated) return <AppShell title="Loading job…" wide />;
  if (!job) throw notFound();
  return <AppShell title="Edit job" eyebrow={job.id} wide bottom={<FieldButton asChild variant="tile" className="flex-row text-base"><Link to="/supervisor/job/$jobId" params={{ jobId }}><ArrowLeft className="size-6" />Back to job</Link></FieldButton>}>
    <JobForm key={job.id} editing initial={{ ...job, tasks: job.tasks.map((task) => task.label) }} onSave={(input, options) => {
      editJob(jobId, input, options);
      reassignJob(jobId, input.technicianId, options);
      navigate({ to: "/supervisor/job/$jobId", params: { jobId } });
    }} />
  </AppShell>;
}