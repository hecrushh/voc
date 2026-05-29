import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { StatusTone } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "border-border bg-muted text-foreground hover:bg-muted/80",
        ghost: "border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        destructive: "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        icon: "h-9 w-9 px-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("rounded-lg border border-border bg-card text-card-foreground shadow-command", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-border px-5 py-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
        className
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: StatusTone | string }) {
  const className =
    status === "online"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : status === "degraded"
        ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
        : status === "offline"
          ? "border-red-400/30 bg-red-400/10 text-red-300"
          : status === "planned" || status === "Offline / Planned"
            ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
            : "border-slate-400/30 bg-slate-400/10 text-slate-300";

  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", className)}>{status}</span>;
}

export function Meter({ value }: { value?: number }) {
  const safeValue = typeof value === "number" ? Math.max(0, Math.min(100, value)) : 0;
  const tone = safeValue >= 90 ? "bg-red-400" : safeValue >= 75 ? "bg-amber-400" : "bg-emerald-400";

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full", tone)} style={{ width: `${safeValue}%` }} />
    </div>
  );
}
