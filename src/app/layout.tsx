import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

const SITE_URL = "https://callguard-pro.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CallGuard — Free Caller ID & Spam Detection",
    template: "%s | CallGuard",
  },
  description: "Free community-powered caller ID and spam detection. Search any phone number to get real-time carrier info, fraud scores, and caller identity. No signup required.",
  keywords: [
    "caller ID", "spam detection", "phone lookup", "reverse phone lookup",
    "scam call", "telemarketer", "phone number search", "caller name",
    "spam shield", "phone validator", "carrier lookup", "fraud detection",
    "free caller ID", "phone spam", "block spam calls"
  ],
  authors: [{ name: "Jojin John", url: "https://www.linkedin.com/in/jojin-john/" }],
  creator: "Jojin John",
  publisher: "CallGuard",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "CallGuard",
    title: "CallGuard — Free Caller ID & Spam Detection",
    description: "Free community-powered caller ID and spam detection. Search any phone number to get real-time carrier info, fraud scores, and caller identity.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CallGuard — Know who's calling before you answer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CallGuard — Free Caller ID & Spam Detection",
    description: "Free community-powered caller ID and spam detection. Search any phone number to get real-time carrier info, fraud scores, and caller identity.",
    images: ["/og-image.png"],
    creator: "@callguard",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "CallGuard",
    url: SITE_URL,
    description: "Free community-powered caller ID and spam detection platform. Search any phone number to get real-time carrier info, fraud scores, and caller identity.",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "Jojin John",
      url: "https://www.linkedin.com/in/jojin-john/",
    },
    featureList: [
      "Triple-Engine Phone Lookup",
      "Community Spam Reports",
      "Crowd Voting on Caller Names",
      "Bulk Phone Scanning",
      "Developer API",
      "Free to use"
    ],
  };

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0a0f18" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-ink font-body text-fog antialiased">
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-5xl px-5 pb-24 pt-10">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
