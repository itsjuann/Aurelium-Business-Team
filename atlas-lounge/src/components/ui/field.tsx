import * as React from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full border-0 border-b border-charcoal/25 bg-transparent px-0 py-3 text-base text-charcoal placeholder:text-stone/70 transition-colors focus:border-bronze focus:outline-none focus-visible:outline-none aria-[invalid=true]:border-red-800";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-28 resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select className={cn(control, "appearance-none rounded-none pr-8", className)} {...props}>
      {children}
    </select>
  );
}

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Label + control + hint/error, wired for assistive technology via the shared id. */
export function Field({ id, label, error, hint, optional, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <label
        htmlFor={id}
        className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-stone"
      >
        {label}
        {optional ? <span className="ml-2 normal-case tracking-normal text-stone/80">(optional)</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-2 text-sm text-stone">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Props that connect a control to its Field's hint and error text. */
export function describe(id: string, error?: string, hint?: string) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}
