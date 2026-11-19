"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitContact, type ActionResult } from "@/app/actions/leads";
import { applyFieldErrors, FormError, FormSuccess, Honeypot } from "@/components/forms/form-shell";
import { Button } from "@/components/ui/button";
import { describe, Field, Input, Select, Textarea } from "@/components/ui/field";
import { contactSchema, contactTopics, type ContactInput } from "@/lib/schemas";

export function ContactForm() {
  const [result, setResult] = React.useState<ActionResult | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { fullName: "", email: "", phone: "", topic: contactTopics[0], message: "", company: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const response = await submitContact(values);
    applyFieldErrors<keyof ContactInput>(response, setError);
    setResult(response);
  });

  if (result?.status === "success") return <FormSuccess message={result.message} />;

  return (
    <form onSubmit={onSubmit} noValidate className="relative grid gap-8 sm:grid-cols-2">
      <Honeypot {...register("company")} />
      <Field id="contact-name" label="Name" error={errors.fullName?.message}>
        <Input autoComplete="name" {...describe("contact-name", errors.fullName?.message)} {...register("fullName")} />
      </Field>
      <Field id="contact-email" label="Email" error={errors.email?.message}>
        <Input type="email" autoComplete="email" {...describe("contact-email", errors.email?.message)} {...register("email")} />
      </Field>
      <Field id="contact-phone" label="Phone" optional error={errors.phone?.message}>
        <Input type="tel" autoComplete="tel" {...describe("contact-phone", errors.phone?.message)} {...register("phone")} />
      </Field>
      <Field id="contact-topic" label="Topic" error={errors.topic?.message}>
        <Select {...describe("contact-topic", errors.topic?.message)} {...register("topic")}>
          {contactTopics.map((topic) => (
            <option key={topic}>{topic}</option>
          ))}
        </Select>
      </Field>
      <Field
        id="contact-message"
        label="Message"
        className="sm:col-span-2"
        error={errors.message?.message}
        hint="Please do not include health or medical details here."
      >
        <Textarea
          rows={5}
          {...describe("contact-message", errors.message?.message, "hint")}
          {...register("message")}
        />
      </Field>
      <div className="space-y-5 sm:col-span-2">
        <FormError result={result} />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
