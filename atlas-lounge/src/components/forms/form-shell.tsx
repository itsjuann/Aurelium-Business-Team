"use client";

import * as React from "react";
import { Check } from "lucide-react";
import type { ActionResult } from "@/app/actions/leads";

/** Hidden trap field. Real visitors never see or fill it. */
export function Honeypot(props: React.ComponentProps<"input">) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Company
        <input type="text" tabIndex={-1} autoComplete="off" {...props} />
      </label>
    </div>
  );
}

export function FormError({ result }: { result: ActionResult | null }) {
  if (result?.status !== "error") return null;
  return (
    <p role="alert" className="border-l-2 border-red-800 bg-red-800/5 px-4 py-3 text-sm text-red-900">
      {result.message}
    </p>
  );
}

export function FormSuccess({ message, onDark = false }: { message: string; onDark?: boolean }) {
  return (
    <div role="status" className="flex items-start gap-4 py-2">
      <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-bronze text-bronze">
        <Check className="size-4" aria-hidden />
      </span>
      <p className={onDark ? "text-lg leading-relaxed text-ivory" : "text-lg leading-relaxed text-charcoal"}>
        {message}
      </p>
    </div>
  );
}

/** Applies server-side field errors onto a React Hook Form instance. */
export function applyFieldErrors<T extends string>(
  result: ActionResult,
  setError: (name: T, error: { message: string }) => void,
) {
  if (result.status === "error" && result.fieldErrors) {
    for (const [name, message] of Object.entries(result.fieldErrors)) {
      setError(name as T, { message });
    }
  }
}
