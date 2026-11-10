import { Link, createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  ClipboardList,
  Clock,
  Flame,
  Hand,
  LayoutDashboard,
  MapPin,
  Settings2,
  User,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";

/*
 * Marketing landing page. Unlike the field screens it does not use AppShell: it is a
 * full-width desktop-first page. It still uses only the theme tokens from styles.css.
 */

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "AdvantiQ — Every technician arrives ready" },
      {
        name: "description",
        content:
          "AdvantiQ gives installation technicians the right job information before work starts, and makes sure every change is seen.",
      },
      { property: "og:title", content: "AdvantiQ — Every technician arrives ready" },
      {
        property: "og:description",
        content:
          "Job readiness for heating, electrical, mechanical and welding teams. Changes highlighted, confirmed with one tap.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LandingPage,
});

const container = "mx-auto w-full max-w-6xl px-gutter";
const primaryCta =
  "inline-flex min-h-tap items-center justify-center gap-2 rounded-full bg-foreground px-7 text-base font-bold text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring";
const secondaryCta =
  "bg-brand inline-flex min-h-tap items-center justify-center gap-2 rounded-full border border-input px-7 text-base font-bold text-foreground transition hover:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring";

function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <Trades />
        <Problem />
        <Features />
        <HowItWorks />
        <Audiences />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img src="/advantiq-mark.png" alt="" width={342} height={192} className="h-8 w-auto" />
      <span className="font-display text-lg tracking-[0.22em] text-foreground">ADVANTIQ</span>
    </span>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className={`${container} flex h-18 items-center justify-between gap-6 py-3`}>
        <a href="#top" aria-label="AdvantiQ home">
          <Logo />
        </a>
        <nav className="hidden items-center gap-8 text-sm font-bold md:flex" aria-label="Page sections">
          <a href="#features" className="hover:text-brand-ink">Product</a>
          <a href="#how" className="hover:text-brand-ink">How it works</a>
          <a href="#teams" className="hover:text-brand-ink">For teams</a>
        </nav>
        <Link to="/" className={`${primaryCta} min-h-11 px-5 text-sm`}>
          Open demo
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-gradient-to-b from-accent to-background"
      />
      <div className={`${container} relative grid items-center gap-14 pb-20 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24`}>
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-4 py-1.5 text-sm font-bold">
            <span className="size-2 rounded-full bg-success" aria-hidden />
            Job readiness for installation teams
          </span>
          <h1 className="mt-6 font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            Every technician
            <br />
            arrives <span className="text-brand-ink">ready.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            AdvantiQ puts the right job information in your technicians’ hands before work starts —
            and makes sure every last-minute change has actually been seen.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/" className={primaryCta}>
              Try the live demo <ArrowRight className="size-5" />
            </Link>
            <a href="#how" className={secondaryCta}>
              See how it works
            </a>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-muted-foreground">
            {["No training needed", "Works on any phone", "Built for gloves & sunlight"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-success" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <PhonePreview />
      </div>
    </section>
  );
}

/** Static illustration of the technician screen, built from the same tokens as the real app. */
function PhonePreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-label="Preview of the AdvantiQ technician app" role="img">
      <div className="rounded-[2.75rem] border-[10px] border-foreground bg-background p-5 shadow-[0_30px_80px_-30px_oklch(0.207_0.052_272.9/0.45)]">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm tracking-widest text-brand-ink">ADVANTIQ</span>
          <span className="rounded-full border border-input px-3 py-1 text-xs font-bold">Technician A</span>
        </div>
        <p className="mt-4 font-display text-2xl">My jobs</p>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-change-border bg-change-surface p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-change-soft text-change">
            <BellRing className="size-4" />
          </span>
          <span className="text-sm font-bold leading-tight">Job updated — tap to see what changed</span>
        </div>
        <div className="mt-3 rounded-2xl border-2 border-change-border bg-change-surface p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-lg leading-tight">Boiler room renovation</p>
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-change-border bg-change-soft px-2.5 py-0.5 text-xs font-bold text-change">
              <AlertTriangle className="size-3" /> Updated
            </span>
          </div>
          <div className="mt-2 space-y-1 text-sm">
            <p className="flex items-center gap-2 font-semibold"><User className="size-3.5" /> Van Dijk Facilities</p>
            <p className="flex items-center gap-2"><MapPin className="size-3.5" /> Industrieweg 14, Utrecht</p>
            <p className="flex items-center gap-2 font-bold"><Clock className="size-3.5" /> Today · 08:00 – 12:30</p>
          </div>
          <div className="mt-3 rounded-xl bg-card p-3 text-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Access equipment</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 font-bold">
              <span className="text-muted-foreground line-through">10 m scissor lift</span>
              <ArrowRight className="size-3.5" />
              <span className="text-change-foreground">15 m scissor lift</span>
            </p>
          </div>
          <div className="mt-3 grid min-h-11 place-items-center rounded-2xl border border-change-border bg-change-fill text-sm font-bold">
            Seen
          </div>
        </div>
        <div className="mt-3 rounded-2xl border-2 border-border p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-lg leading-tight">Heat pump installation</p>
            <span className="rounded-full border border-change-border/60 bg-pending px-2.5 py-0.5 text-xs font-bold text-change-foreground">
              Not started
            </span>
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold"><Clock className="size-3.5" /> Tomorrow · 09:00 – 15:00</p>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-6 hidden items-center gap-2 rounded-2xl border-2 border-success bg-card px-4 py-3 text-sm font-bold shadow-lg sm:flex">
        <CheckCircle2 className="size-5 text-success" />
        Seen by technician · 07:42
      </div>
    </div>
  );
}

function Trades() {
  const trades: Array<[string, ReactNode]> = [
    ["Heating", <Flame key="h" className="size-5" />],
    ["Electrical", <Zap key="e" className="size-5" />],
    ["Mechanical", <Settings2 key="m" className="size-5" />],
    ["Welding", <Wrench key="w" className="size-5" />],
  ];
  return (
    <section className="border-y border-border bg-secondary">
      <div className={`${container} flex flex-col items-center gap-5 py-8 md:flex-row md:justify-between`}>
        <p className="text-sm font-extrabold uppercase tracking-widest">Built for small installation companies</p>
        <ul className="flex flex-wrap justify-center gap-3">
          {trades.map(([name, icon]) => (
            <li key={name} className="flex items-center gap-2 rounded-full border border-input bg-card px-4 py-2 font-bold">
              {icon}
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-extrabold uppercase tracking-widest text-brand-ink">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{title}</h2>
      {intro && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{intro}</p>}
    </div>
  );
}

function Problem() {
  const pains = [
    {
      title: "Changes get lost",
      text: "A bigger lift, a new timeslot, a different address — sent by text or call, and missed on site.",
    },
    {
      title: "Wasted trips",
      text: "Technicians arrive without the right equipment, materials or people, and the day is gone.",
    },
    {
      title: "No confirmation",
      text: "Supervisors can’t tell whether the technician actually saw the update before leaving.",
    },
  ];
  return (
    <section className="py-24">
      <div className={`${container} grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start`}>
        <SectionHeading
          eyebrow="The problem"
          title="Last-minute changes shouldn’t reach the site by accident."
          intro="In installation work, the plan changes. What matters is that the person doing the job knows — before the van leaves."
        />
        <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {pains.map((p) => (
            <li key={p.title} className="rounded-3xl border border-border bg-card p-6">
              <p className="flex items-center gap-2 font-display text-lg">
                <XCircle className="size-5 text-cancel-foreground" aria-hidden />
                {p.title}
              </p>
              <p className="mt-2 leading-relaxed text-muted-foreground">{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: <ClipboardList className="size-6" />,
      title: "One clear job overview",
      text: "Customer, address, timeslot, tasks and required items on a single screen. No digging.",
    },
    {
      icon: <AlertTriangle className="size-6" />,
      title: "Changes highlighted",
      text: "Every update shows exactly what changed — old value, new value — and marks the affected task.",
    },
    {
      icon: <CheckCircle2 className="size-6" />,
      title: "Confirmed with one tap",
      text: "Technicians tap “Seen”. Supervisors see who confirmed what, and when.",
    },
    {
      icon: <LayoutDashboard className="size-6" />,
      title: "Supervisor dashboard",
      text: "Create, edit and reassign jobs. Filter by technician and status, with live updates.",
    },
    {
      icon: <XCircle className="size-6" />,
      title: "Cancellations with a reason",
      text: "Remove a job and the technician immediately sees it cancelled — and why.",
    },
    {
      icon: <Hand className="size-6" />,
      title: "Made for the field",
      text: "Large tap targets, high contrast and short text. Usable one-handed, with gloves, in poor light.",
    },
  ];
  return (
    <section id="features" className="scroll-mt-20 bg-secondary py-24">
      <div className={container}>
        <SectionHeading
          eyebrow="Product"
          title="Everything the technician needs. Nothing they don’t."
          intro="AdvantiQ is deliberately simple: one main action per screen, so the right information gets through."
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f.title} className="rounded-3xl border border-border bg-card p-7 transition hover:border-input">
              <span className="bg-brand grid size-12 place-items-center rounded-2xl text-foreground">{f.icon}</span>
              <h3 className="mt-5 font-display text-xl">{f.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{f.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Supervisor updates the job",
      text: "Change the equipment, timeslot or tasks from the dashboard — and add a short note why.",
    },
    {
      title: "Technician sees what changed",
      text: "The job lights up in yellow with the old and new value side by side. Impossible to miss.",
    },
    {
      title: "One tap confirms it",
      text: "The technician taps “Seen” and the supervisor gets confirmation with a timestamp.",
    },
  ];
  return (
    <section id="how" className="scroll-mt-20 py-24">
      <div className={container}>
        <SectionHeading eyebrow="How it works" title="From change to confirmation in three steps." />
        <ol className="mt-14 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-3xl border border-border bg-card p-7">
              <span className="grid size-11 place-items-center rounded-full bg-foreground font-display text-lg text-background">
                {i + 1}
              </span>
              <h3 className="mt-5 font-display text-xl">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Audiences() {
  const groups = [
    {
      title: "For technicians",
      points: [
        "Today’s jobs at a glance",
        "Clear alert when something changes",
        "Route, checklist and supervisor one tap away",
      ],
    },
    {
      title: "For supervisors",
      points: [
        "Plan and assign jobs across the team",
        "See which updates have been confirmed",
        "Cancel jobs with a clear reason",
      ],
    },
  ];
  return (
    <section id="teams" className="scroll-mt-20 bg-secondary py-24">
      <div className={container}>
        <SectionHeading eyebrow="For teams" title="One shared picture of every job." />
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {groups.map((g) => (
            <div key={g.title} className="rounded-3xl border border-border bg-card p-8">
              <h3 className="font-display text-2xl">{g.title}</h3>
              <ul className="mt-5 space-y-3">
                {g.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-lg font-semibold">
                    <CheckCircle2 className="mt-1 size-5 shrink-0 text-success" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="py-24">
      <div className={container}>
        <div className="flex flex-col items-center rounded-[2.5rem] bg-foreground px-6 py-16 text-center text-background sm:px-12">
          <img src="/advantiq-mark.png" alt="" width={342} height={192} className="h-14 w-auto brightness-0 invert" />
          <h2 className="mt-8 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">
            See AdvantiQ in action.
          </h2>
          <p className="mt-4 max-w-xl text-lg text-background/80">
            Open the live demo and switch between technician and supervisor to see an update travel from
            the office to the site.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/" className={`${secondaryCta} border-transparent`}>
              Try the live demo <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className={`${container} flex flex-col items-center justify-between gap-4 py-10 sm:flex-row`}>
        <Logo />
        <p className="text-sm font-semibold text-muted-foreground">
          © {new Date().getFullYear()} AdvantiQ · Job readiness for installation teams
        </p>
      </div>
    </footer>
  );
}
