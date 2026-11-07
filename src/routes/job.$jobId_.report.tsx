import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Mic } from "lucide-react";
import { AppShell } from "@/components/field/AppShell";
import { FieldButton } from "@/components/field/FieldButton";

export const Route = createFileRoute("/job/$jobId_/report")({
  head: () => ({
    meta: [
      { title: "Report — AdvantiQ" },
      { name: "description", content: "Voice report for this job. Coming next." },
      { property: "og:title", content: "Report — AdvantiQ" },
      { property: "og:description", content: "Voice report for this job. Coming next." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportPlaceholder,
});

function ReportPlaceholder() {
  const { jobId } = Route.useParams();
  return (
    <AppShell
      title="Report"
      eyebrow={jobId}
      bottom={
        <FieldButton asChild variant="tile" className="min-h-tap flex-row text-base">
          <Link to="/job/$jobId" params={{ jobId }}>
            <ArrowLeft className="size-6" /> Back to job
          </Link>
        </FieldButton>
      }
    >
      <section className="flex flex-col items-center gap-4 rounded-3xl bg-card p-8 text-center">
        <Mic className="size-12 text-primary" />
        <p className="text-xl font-bold">Coming next</p>
      </section>
    </AppShell>
  );
}
