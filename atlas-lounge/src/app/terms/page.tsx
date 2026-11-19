import type { Metadata } from "next";
import { contactLine, LegalPage, type LegalSection } from "@/components/site/legal";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms that apply to using The Atlas Lounge website and services.",
};

const sections: LegalSection[] = [
  {
    heading: "About these terms",
    body: [
      "These terms apply to your use of The Atlas Lounge website and to appointments arranged with us. By using the website or requesting an appointment, you agree to them.",
    ],
  },
  {
    heading: "Wellness services, not medical care",
    body: [
      "Our services are intended for general wellness and relaxation. They are not medical treatment, and nothing on this website is medical advice. We do not diagnose, treat, or cure any condition.",
      "If you have a medical condition, an injury, are pregnant, or are unsure whether a service is suitable for you, please consult a licensed healthcare provider before booking.",
    ],
  },
  {
    heading: "Appointments",
    body: [
      "Submitting a request through this website does not create a booking. An appointment is confirmed only when we confirm it with you in writing.",
      "We may decline or end an appointment where we reasonably consider that a service is not suitable, or where a safe and professional environment cannot be maintained.",
    ],
  },
  {
    heading: "Prices and payment",
    body: [
      "Prices shown on the website are per session and may change; the price confirmed with your appointment is the price that applies. Any travel fee is confirmed before you pay.",
    ],
  },
  {
    heading: "Cancellations and rescheduling",
    body: [
      "The cancellation, rescheduling, and no-show terms that apply to your appointment are provided in writing when the appointment is confirmed.",
    ],
  },
  {
    heading: "Mobile sessions",
    body: [
      "For sessions at your location, you agree to provide a safe, private, and suitable space. Practitioners may decline to proceed if the environment is unsafe or unsuitable.",
    ],
  },
  {
    heading: "Conduct",
    body: [
      "Our sessions are strictly professional. Inappropriate, abusive, or unsafe behaviour will result in the session ending immediately and may result in refusal of future service.",
    ],
  },
  {
    heading: "Future lounge and memberships",
    body: [
      "Information about the future lounge, its amenities, and memberships describes plans that may change. It is not an offer, and joining a waitlist does not create any commitment on your part or ours.",
    ],
  },
  {
    heading: "Website",
    body: [
      "We work to keep the information on this website accurate and current, but it is provided as general information and may change without notice.",
    ],
  },
  {
    heading: "Contact",
    body: [contactLine()],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      intro="The essentials of using this website and arranging an appointment with us."
      sections={sections}
    />
  );
}
