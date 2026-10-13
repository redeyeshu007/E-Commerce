import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { brandConfig } from "@/config/brand";

export const metadata: Metadata = {
  title: `Contact Us | ${brandConfig.name}`,
  description:
    "Get in touch with PERALAGAE jewellery concierge for private appointments, bespoke commissions, and fine jewellery inquiries.",
};

export default function ContactPage() {
  return (
    <main className="w-full min-h-screen bg-white">
      {/* 1. Header Banner */}
      <section className="relative w-full bg-[#FAF9F5] border-b border-[#EBEBEB] py-12 md:py-16 text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="flex items-center justify-center space-x-2 text-xs uppercase tracking-[0.1em] text-[#777777]">
              <li>
                <Link href="/" className="transition-colors hover:text-black">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[#111111] font-medium" aria-current="page">
                Contact
              </li>
            </ol>
          </nav>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-[#111111]">
            Contact Us
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#666666] max-w-xl mx-auto font-light">
            Our jewellery concierge is dedicated to assisting you with personal appointments, custom orders, and fine jewellery guidance.
          </p>
        </div>
      </section>

      {/* 2. Contact Details & Inquiry */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: Boutique & Concierge Information */}
          <div className="space-y-8">
            <div>
              <span className="text-xs uppercase font-semibold tracking-[0.15em] text-[#C5A572]">
                Concierge Assistance
              </span>
              <h2 className="mt-2 text-2xl font-serif text-[#111111]">
                We Would Love to Hear From You
              </h2>
              <p className="mt-2 text-sm text-[#666666] leading-relaxed">
                Whether selecting an heirloom gift or requesting diamond specifications, our dedicated specialists are here to assist.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Phone */}
              <div className="p-6 border border-[#EAEAEA] rounded-sm bg-[#FAFAFA]/50 space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF9F5] text-[#C5A572]">
                  <Phone className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-[#111111]">Phone & WhatsApp</h3>
                <p className="text-xs text-[#666666]">+91 98765 43210</p>
                <p className="text-[11px] text-[#888888]">Direct luxury concierge line</p>
              </div>

              {/* Email */}
              <div className="p-6 border border-[#EAEAEA] rounded-sm bg-[#FAFAFA]/50 space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF9F5] text-[#C5A572]">
                  <Mail className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-[#111111]">Email Concierge</h3>
                <p className="text-xs text-[#666666]">concierge@peralagae.com</p>
                <p className="text-[11px] text-[#888888]">Responses within 24 hours</p>
              </div>

              {/* Boutique */}
              <div className="p-6 border border-[#EAEAEA] rounded-sm bg-[#FAFAFA]/50 space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF9F5] text-[#C5A572]">
                  <MapPin className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-[#111111]">Flagship Boutique</h3>
                <p className="text-xs text-[#666666]">Bandra West, Mumbai 400050</p>
                <p className="text-[11px] text-[#888888]">Maharashtra, India</p>
              </div>

              {/* Hours */}
              <div className="p-6 border border-[#EAEAEA] rounded-sm bg-[#FAFAFA]/50 space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF9F5] text-[#C5A572]">
                  <Clock className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-[#111111]">Boutique Hours</h3>
                <p className="text-xs text-[#666666]">Mon – Sat: 10:00 AM – 8:00 PM</p>
                <p className="text-[11px] text-[#888888]">Sundays: By private appointment</p>
              </div>
            </div>
          </div>

          {/* Right: Elegant Contact Form */}
          <div className="p-8 sm:p-10 border border-[#EAEAEA] rounded-sm bg-white shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-serif text-[#111111]">Send an Inquiry</h3>
              <p className="mt-1 text-xs text-[#777777]">
                Fill out the form below and an advisor will respond promptly.
              </p>
            </div>

            <form className="space-y-4" action="#">
              <div>
                <label className="block text-xs font-medium text-[#444444] uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-2.5 text-sm border border-[#D5D5D5] rounded-sm focus:outline-none focus:border-[#C5A572] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#444444] uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@domain.com"
                    className="w-full px-4 py-2.5 text-sm border border-[#D5D5D5] rounded-sm focus:outline-none focus:border-[#C5A572] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#444444] uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 text-sm border border-[#D5D5D5] rounded-sm focus:outline-none focus:border-[#C5A572] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#444444] uppercase tracking-wider mb-1.5">
                  Message or Bespoke Request
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell us about the jewellery piece or service you are interested in..."
                  className="w-full px-4 py-2.5 text-sm border border-[#D5D5D5] rounded-sm focus:outline-none focus:border-[#C5A572] transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 bg-[#111111] text-white text-xs uppercase font-medium tracking-[0.15em] transition-colors hover:bg-[#C5A572]"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
