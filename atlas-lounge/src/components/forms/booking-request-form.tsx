"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestAppointment, type ActionResult } from "@/app/actions/leads";
import { applyFieldErrors, FormError, FormSuccess, Honeypot } from "@/components/forms/form-shell";
import { Button } from "@/components/ui/button";
import { describe, Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  bookingRequestSchema,
  type BookingRequestFormValues,
  type BookingRequestInput,
} from "@/lib/schemas";
import { formatPrice } from "@/lib/utils";

export interface RequestableService {
  slug: string;
  name: string;
  variants: { durationMin: number; priceCents: number }[];
}

interface Props {
  services: RequestableService[];
  initialServiceSlug?: string;
}

export function BookingRequestForm({ services, initialServiceSlug }: Props) {
  const [result, setResult] = React.useState<ActionResult | null>(null);
  const initial = services.find((s) => s.slug === initialServiceSlug) ?? services[0];

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BookingRequestFormValues, unknown, BookingRequestInput>({
    resolver: zodResolver(bookingRequestSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      serviceSlug: initial.slug,
      durationMin: initial.variants[0].durationMin,
      postalCode: "",
      preferredTimes: "",
      notes: "",
      company: "",
    },
  });

  const serviceSlug = useWatch({ control, name: "serviceSlug" });
  const selected = services.find((s) => s.slug === serviceSlug) ?? initial;

  const onSubmit = handleSubmit(async (values) => {
    const response = await requestAppointment(values);
    applyFieldErrors<keyof BookingRequestFormValues>(response, setError);
    setResult(response);
  });

  if (result?.status === "success") return <FormSuccess message={result.message} />;

  return (
    <form onSubmit={onSubmit} noValidate className="relative grid gap-8 sm:grid-cols-2">
      <Honeypot {...register("company")} />

      <Field id="request-service" label="Service" error={errors.serviceSlug?.message}>
        <Select
          {...describe("request-service", errors.serviceSlug?.message)}
          {...register("serviceSlug", {
            onChange: (event) => {
              const next = services.find((s) => s.slug === event.target.value);
              if (next) setValue("durationMin", next.variants[0].durationMin);
            },
          })}
        >
          {services.map((service) => (
            <option key={service.slug} value={service.slug}>
              {service.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="request-duration" label="Duration" error={errors.durationMin?.message}>
        <Select {...describe("request-duration", errors.durationMin?.message)} {...register("durationMin")}>
          {selected.variants.map((variant) => (
            <option key={variant.durationMin} value={variant.durationMin}>
              {variant.durationMin} minutes · {formatPrice(variant.priceCents)}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="request-name" label="Name" error={errors.fullName?.message}>
        <Input autoComplete="name" {...describe("request-name", errors.fullName?.message)} {...register("fullName")} />
      </Field>
      <Field id="request-email" label="Email" error={errors.email?.message}>
        <Input type="email" autoComplete="email" {...describe("request-email", errors.email?.message)} {...register("email")} />
      </Field>
      <Field id="request-phone" label="Phone" error={errors.phone?.message}>
        <Input type="tel" autoComplete="tel" {...describe("request-phone", errors.phone?.message)} {...register("phone")} />
      </Field>
      <Field
        id="request-postal"
        label="Postal code"
        error={errors.postalCode?.message}
        hint="Where the session would take place, so we can confirm we travel to you."
      >
        <Input
          autoComplete="postal-code"
          {...describe("request-postal", errors.postalCode?.message, "hint")}
          {...register("postalCode")}
        />
      </Field>

      <Field
        id="request-times"
        label="Preferred days and times"
        className="sm:col-span-2"
        error={errors.preferredTimes?.message}
        hint="For example: weekday evenings after 6pm, or Saturday morning."
      >
        <Textarea rows={3} {...describe("request-times", errors.preferredTimes?.message, "hint")} {...register("preferredTimes")} />
      </Field>
      <Field
        id="request-notes"
        label="Anything else"
        optional
        className="sm:col-span-2"
        error={errors.notes?.message}
        hint="Access or parking notes are helpful. Please do not include health details here; we collect those privately before your session."
      >
        <Textarea rows={3} {...describe("request-notes", errors.notes?.message, "hint")} {...register("notes")} />
      </Field>

      <div className="space-y-6 sm:col-span-2">
        <div>
          <label className="flex items-start gap-4 text-sm leading-relaxed text-stone">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 accent-[#1F3D36]"
              aria-invalid={errors.acknowledgement ? true : undefined}
              aria-describedby={errors.acknowledgement ? "request-ack-error" : undefined}
              {...register("acknowledgement")}
            />
            <span>
              I understand this is a request, not a confirmed booking, and that no payment is taken now. The
              Atlas Lounge will contact me to confirm a time, any travel fee, and the cancellation terms.
            </span>
          </label>
          {errors.acknowledgement ? (
            <p id="request-ack-error" role="alert" className="mt-2 text-sm text-red-800">
              {errors.acknowledgement.message}
            </p>
          ) : null}
        </div>
        <FormError result={result} />
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Sending" : "Request appointment"}
        </Button>
      </div>
    </form>
  );
}
