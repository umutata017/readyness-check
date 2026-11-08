import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { FieldButton } from "./FieldButton";

/** Shared glove-friendly form controls for the supervisor screens. */

export const fieldControlClass =
  "min-h-tap w-full rounded-2xl border border-input bg-secondary px-4 py-3 text-base font-semibold text-secondary-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring";

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-sm font-extrabold uppercase tracking-widest text-muted-foreground">{children}</span>;
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldControlClass, className)} {...props} />;
}

export function FieldSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldControlClass, "appearance-none", className)} {...props}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <FieldButton
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-tap w-full items-center justify-between gap-4 rounded-2xl border border-input bg-secondary px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
    >
      <span className="text-base font-bold text-secondary-foreground">{label}</span>
      <span
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full transition",
          checked ? "bg-success" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-6 rounded-full bg-foreground transition-all",
            checked ? "left-7" : "left-1",
          )}
        />
      </span>
    </FieldButton>
  );
}
