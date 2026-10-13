import type { Metadata } from "next";
import { ContactPageContent } from "@/components/contact/contact-page-content";
import { brandConfig } from "@/config/brand";

export const metadata: Metadata = {
  title: `Contact Us | ${brandConfig.name}`,
  description:
    "We're here to help with your jewellery enquiries. Reach out to the PERALAGAE customer care team for assistance with pieces, custom orders, or purchases.",
  openGraph: {
    title: `Contact Us | ${brandConfig.name}`,
    description:
      "We're here to help with your jewellery enquiries. Reach out to the PERALAGAE customer care team for assistance with pieces, custom orders, or purchases.",
    type: "website",
  },
};

export default function ContactPage() {
  return <ContactPageContent />;
}
