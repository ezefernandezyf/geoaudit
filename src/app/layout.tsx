import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono, Work_Sans } from "next/font/google";
import { auth } from "@/lib/auth";
import { Footer } from "@/ui/footer";
import { Navbar } from "@/ui/navbar";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // U2.1/SHL-1: resolve the session once here and pass it down to the Navbar
  // (a synchronous server component that cannot itself await auth() — RTL and
  // static prerendering can't await an async component in the tree).
  const session = await auth();

  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${workSans.variable} ${jetBrainsMono.variable} antialiased`}
      >
        <Navbar session={session} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
