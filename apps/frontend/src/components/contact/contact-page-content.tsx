"use client";

import React from "react";
import { ContactHero } from "./contact-hero";
import { ContactDetails } from "./contact-details";
import { ContactForm } from "./contact-form";

/**
 * ContactPageContent Component — PERALAGAE
 *
 * Implements the minimal, royal luxury contact page:
 * 1. Wide jewellery background hero banner matching Shop & Wishlist styles
 * 2. Balanced two-column layout:
 *    - Left: Understated introduction & strictly 2 authentic contact details (Email, Phone/WhatsApp)
 *    - Right: Refined, clean contact form with field-specific validation and clean integration boundary
 */
export function ContactPageContent() {
  return (
    <main className="w-full min-h-screen bg-white">
      {/* 1. Luxury Inner-Page Title Banner */}
      <ContactHero />

      {/* 2. Main Two-Column Contact Section */}
      <section
        aria-label="Contact Information and Enquiry Form"
        className="w-full bg-white py-14 sm:py-20 lg:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Column: Essential details & introduction */}
            <div className="lg:col-span-5">
              <ContactDetails />
            </div>

            {/* Right Column: Refined contact form */}
            <div className="lg:col-span-7">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
