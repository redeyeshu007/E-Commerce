import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Inter, Jost } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/index";
import { LuxuryPreloader } from "@/components/shared/luxury-preloader";
import { AnimatedTabTitle } from "@/components/shared/animated-tab-title";
import { SiteHeader } from "@/components/navbar/site-header";
import { SiteFooter } from "@/components/layout/footer";
import { brandConfig } from "@/config/brand";
import { fetchPublicNavbarSettings } from "@/services/navbar-settings-service";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env["NEXT_PUBLIC_APP_URL"] || "https://peralagae.com"),
  title: {
    default: brandConfig.metaTitle,
    template: `%s | ${brandConfig.metaTitle}`,
  },
  description: brandConfig.metaDescription,
  openGraph: {
    title: `${brandConfig.name} — Luxury Gold & Fine Jewellery`,
    description: brandConfig.tagline,
    siteName: brandConfig.name,
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${brandConfig.name} — Luxury Gold & Fine Jewellery`,
    description: brandConfig.tagline,
  },
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialNavbar = await fetchPublicNavbarSettings();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${inter.variable} ${jost.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="fdprocessedid-cleanup"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  try {
                    var observer = new MutationObserver(function(mutations) {
                      for (var i = 0; i < mutations.length; i++) {
                        var m = mutations[i];
                        if (m.type === 'attributes' && m.attributeName === 'fdprocessedid') {
                          m.target.removeAttribute('fdprocessedid');
                        }
                      }
                    });
                    observer.observe(document.documentElement, {
                      attributes: true,
                      attributeFilter: ['fdprocessedid'],
                      subtree: true
                    });
                  } catch (e) {}
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-black" suppressHydrationWarning>
        <Providers>
          <AnimatedTabTitle baseTitle={brandConfig.metaTitle} />
          <LuxuryPreloader />
          <SiteHeader initialSettings={initialNavbar} />
          {children}
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
