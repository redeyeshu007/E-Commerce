import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/index";
import { LuxuryPreloader } from "@/components/shared/luxury-preloader";
import { AnimatedTabTitle } from "@/components/shared/animated-tab-title";
import { SiteHeader } from "@/components/navbar/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Javix Jewellery",
    template: "%s | Javix Jewellery",
  },
  description: "Javix Jewellery — Luxury Gold & Fine Jewellery",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  robots: {
    index: false, // Set to true for production deployments
    follow: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white text-black">
        <Providers>
          <AnimatedTabTitle baseTitle="Javix Jewellery" />
          <LuxuryPreloader />
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
