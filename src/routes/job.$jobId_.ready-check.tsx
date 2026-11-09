import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { AppShell } from "@/components/field/AppShell";
import { FieldButton } from "@/components/field/FieldButton";

export const Route = createFileRoute("/job/$jobId_/ready-check")({
  head: () => ({
    meta: [
      { title: "Ready check — AdvantiQ" },
      { name: "description", content: "Ready check for this job. Coming next." },
      { property: "og:title", content: "Ready check — AdvantiQ" },
      { property: "og:description", content: "Ready check for this job. Coming next." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReadyCheckPlaceholder,
});

function ReadyCheckPlaceholder() {
  const { jobId } = Route.useParams();
  return (
    <AppShell
      title="Ready check"
      eyebrow={jobId}
      bottom={
        <FieldButton asChild variant="tile" className="min-h-tap flex-row text-base">
          <Link to="/job/$jobId" params={{ jobId }}>
            <ArrowLeft className="size-6" /> Back to job
          </Link>
        </FieldButton>
      }
    >
      <section className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-8 text-center">
        <ClipboardCheck className="size-12 text-foreground" />
        <p className="text-xl font-bold">Coming next</p>
      </section>
    </AppShell>
  );
}
