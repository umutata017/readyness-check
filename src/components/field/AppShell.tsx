import type { ReactNode } from "react";

/** ADVANTIQ wordmark in the brand blue, same size as the screen title; shared by every screen header. */
export function BrandMark() {
  return <span className="font-display text-3xl leading-tight tracking-wider text-brand-ink">ADVANTIQ</span>;
}

/**
 * Shared mobile screen frame: top bar, scrollable body, sticky bottom action bar. `wide` lets screens use more room on a laptop.
 * The top-right slot shows `headerRight` (e.g. the role switcher) or, failing that, the `eyebrow` badge.
 */
export function AppShell({ title, eyebrow, headerRight, children, bottom, wide }: { title: string; eyebrow?: string; headerRight?: ReactNode; children?: ReactNode; bottom?: ReactNode; wide?: boolean }) {
  return (
    <div className={`mx-auto flex min-h-dvh w-full flex-col bg-background ${wide ? "max-w-md sm:max-w-3xl" : "max-w-md"}`}>
      <header className="px-gutter pb-3 pt-6">
        <div className="flex min-h-tap items-center justify-between gap-3">
          <BrandMark />
          {headerRight ?? (eyebrow && <span className="rounded-full border border-border bg-accent px-3 py-1 text-sm font-bold text-foreground">{eyebrow}</span>)}
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
