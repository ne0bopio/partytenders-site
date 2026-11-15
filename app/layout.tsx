import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Federo, Mulish } from "next/font/google";
import "./globals.css";

const federo = Federo({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-federo",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  weight: "500",
  style: "italic",
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

const mulish = Mulish({
  weight: ["400", "600"],
  style: "normal",
  subsets: ["latin"],
  variable: "--font-mulish",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://partytenderseventparty.com"),
  title: {
    default: "PartyTenders · Your party, we tend",
    template: "%s · PartyTenders",
  },
  description:
    "Bartenders, servers, grill cooks and catering for parties in New Jersey, New York and South Florida. Licensed and insured. Your party, we tend.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "PartyTenders | Your party, we tend",
    description:
      "Bartenders, servers and catering for parties in New Jersey, New York and South Florida.",
    type: "website",
    url: "/",
    siteName: "PartyTenders",
    images: [
      {
        url: "/fotos/venue-flores.jpg",
        width: 1600,
        height: 1200,
        alt: "Wine on ice at a ballroom wedding under a ceiling of flowers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PartyTenders | Your party, we tend",
    description:
      "Bartenders, servers and catering for parties in New Jersey, New York and South Florida.",
    images: ["/fotos/venue-flores.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-p="2"
      data-t="3"
      className={`${federo.variable} ${cormorant.variable} ${mulish.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
