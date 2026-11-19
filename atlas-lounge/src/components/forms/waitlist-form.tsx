"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { joinWaitlist, type ActionResult } from "@/app/actions/leads";
import { applyFieldErrors, FormSuccess, Honeypot } from "@/components/forms/form-shell";
import { Button } from "@/components/ui/button";
import { waitlistSchema, type WaitlistInput } from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface WaitlistFormProps {
  interest: WaitlistInput["interest"];
  onDark?: boolean;
  cta?: string;
  /** Distinguishes multiple waitlist forms on one page for accessible ids. */
  idPrefix?: string;
}

export function WaitlistForm({ interest, onDark = false, cta = "Join the list", idPrefix = "waitlist" }: WaitlistFormProps) {
  const [result, setResult] = React.useState<ActionResult | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistInput>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { email: "", interest, company: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const response = await joinWaitlist(values);
    applyFieldErrors<keyof WaitlistInput>(response, setError);
    setResult(response);
  });

  if (result?.status === "success") return <FormSuccess message={result.message} onDark={onDark} />;

  const emailId = `${idPrefix}-email`;
  const message = errors.email?.message ?? (result?.status === "error" ? result.message : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="relative w-full max-w-xl">
      <input type="hidden" {...register("interest")} />
      <Honeypot {...register("company")} />
      <label
        htmlFor={emailId}
        className={cn(
          "text-[0.7rem] font-medium uppercase tracking-[0.2em]",
          onDark ? "text-mist" : "text-stone",
        )}
      >
        Email address
      </label>
      <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-end">
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? `${emailId}-error` : undefined}
          className={cn(
            "h-12 w-full flex-1 border-0 border-b bg-transparent px-0 text-base focus:border-bronze focus:outline-none focus-visible:outline-none",
            onDark
              ? "border-ivory/30 text-ivory placeholder:text-ivory/40"
              : "border-charcoal/25 text-charcoal placeholder:text-stone/70",
          )}
          {...register("email")}
        />
        <Button type="submit" variant={onDark ? "bronze" : "primary"} disabled={isSubmitting}>
          {isSubmitting ? "Sending" : cta}
        </Button>
      </div>
      {message ? (
        <p id={`${emailId}-error`} role="alert" className={cn("mt-3 text-sm", onDark ? "text-[#f0b8a8]" : "text-red-800")}>
          {message}
        </p>
      ) : (
        <p className={cn("mt-3 text-xs leading-relaxed", onDark ? "text-mist" : "text-stone")}>
          We will only use your email to share updates you asked for. Unsubscribe at any time.
        </p>
      )}
    </form>
  );
}
