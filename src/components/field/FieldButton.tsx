import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldButton = cva(
  "inline-flex min-h-tap w-full items-center justify-center gap-3 rounded-2xl px-5 font-bold text-lg transition active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring disabled:opacity-100",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground",
        change: "bg-change text-change-foreground",
        success: "bg-success text-success-foreground",
        tile: "flex-col gap-1 bg-secondary text-secondary-foreground text-sm py-3 min-h-[4.5rem]",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export function FieldButton({
  className,
  variant,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof fieldButton> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(fieldButton({ variant }), className)} {...props} />;
}
