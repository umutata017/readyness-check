import type { ReactNode } from "react";

/** Shared mobile screen frame: top bar, scrollable body, sticky bottom action bar. `wide` lets supervisor screens use more room on a laptop. */
export function AppShell({ title, eyebrow, children, bottom, wide }: { title: string; eyebrow?: string; children: ReactNode; bottom?: ReactNode; wide?: boolean }) {
  return (
    <div className={`mx-auto flex min-h-dvh w-full flex-col bg-background ${wide ? "max-w-md sm:max-w-3xl" : "max-w-md"}`}>
      <div className="hazard-stripe h-2" aria-hidden />
      <header className="px-gutter pb-3 pt-5">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm tracking-widest text-primary">ADVANTIQ</span>
          {eyebrow && <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-muted-foreground">{eyebrow}</span>}
        </div>
        <h1 className="mt-3 font-display text-3xl leading-tight text-foreground">{title}</h1>
      </header>
      <main className="flex-1 space-y-5 px-gutter pb-6">{children}</main>
      {bottom && (
        <nav className="sticky bottom-0 border-t border-border bg-background/95 px-gutter pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          {bottom}
        </nav>
      )}
    </div>
  );
}
