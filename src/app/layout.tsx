import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono, Work_Sans } from "next/font/google";
import "./globals.css";

/**
 * Typography strategy (STYLE-BRIEF §3, spec DNF-3):
 * Instrument Serif for headings, Work Sans for body/UI, JetBrains Mono for
 * code/JSON-LD. The `variable` names are consumed by the @theme tokens in
 * globals.css (--font-display / --font-sans / --font-mono).
 */
const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "GeoAudit — AI Visibility & GEO Audit",
    template: "%s | GeoAudit",
  },
  description:
    "GEO/SEO audit platform: URL in, GEO Score 0-100 and a full AI visibility report out.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${workSans.variable} ${jetBrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
