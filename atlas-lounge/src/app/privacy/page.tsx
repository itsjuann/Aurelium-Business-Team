import type { Metadata } from "next";
import { contactLine, LegalPage, type LegalSection } from "@/components/site/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How The Atlas Lounge collects, uses, and protects personal information.",
};

const sections: LegalSection[] = [
  {
    heading: "Who we are",
    body: [
      "The Atlas Lounge provides private, appointment-based wellness services. This policy explains what personal information we collect through this website and our services, why we collect it, and the choices you have.",
    ],
  },
  {
    heading: "Information we collect",
    body: [
      "We collect only what we need to respond to you and to deliver our services:",
      [
        "Contact details you give us, such as your name, email address, and phone number.",
        "Appointment details, such as the service requested, preferred times, and the postal code or address where a session will take place.",
        "Intake and consent information you provide before a session, which may include health-related details relevant to delivering the session safely.",
        "Messages you send us, and your communication preferences.",
        "Basic technical information needed to operate and secure the website, such as IP address and browser type.",
      ],
      "Please do not send health information through the general contact or booking request forms. We collect it separately and privately before your session.",
    ],
  },
  {
    heading: "How we use information",
    body: [
      [
        "To respond to enquiries and arrange, confirm, and deliver appointments.",
        "To send appointment confirmations, reminders, and service messages.",
        "To send updates you have asked for, such as waitlist or membership news. You can unsubscribe at any time.",
        "To keep our services safe, prevent misuse, and meet our legal obligations.",
      ],
      "We do not sell personal information.",
    ],
  },
  {
    heading: "Intake and consent information",
    body: [
      "Intake and consent information is treated as sensitive. Access is restricted to the practitioner delivering your session and to authorised administrators, and it is used only to deliver your session safely and to keep appropriate records.",
    ],
  },
  {
    heading: "Payments",
    body: [
      "When online payment is offered, payments are processed by a third-party payment provider. We do not receive or store your full card details.",
    ],
  },
  {
    heading: "Service providers",
    body: [
      "We use trusted providers to host this website, store data, process payments, and deliver email and text messages. They may process personal information on our behalf and only under our instructions.",
    ],
  },
  {
    heading: "Text messages",
    body: [
      "Text message reminders are optional and sent only with your consent. You can opt out at any time by replying STOP. Message and data rates may apply.",
    ],
  },
  {
    heading: "Retention",
    body: [
      "We keep personal information only for as long as it is needed for the purposes described here, or as required by law, and then delete or anonymise it. Specific retention periods will be published here once finalised.",
    ],
  },
  {
    heading: "Your choices",
    body: [
      "You may ask to access, correct, or delete your personal information, or to change how we contact you. Depending on where you live, you may have additional rights under applicable privacy law.",
      contactLine(),
    ],
  },
  {
    heading: "Changes to this policy",
    body: ["We will update this page when our practices change, and revise the date at the top."],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="We collect as little as we can, protect what we hold, and never sell your information."
      sections={sections}
    />
  );
}
