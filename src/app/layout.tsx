import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono, Work_Sans } from "next/font/google";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BRAND_DESCRIPTOR, BRAND_NAME } from "@/lib/brand";
import { resolveNavPlan, type NavPlan } from "@/lib/nav-plan";
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
    default: `${BRAND_NAME} — ${BRAND_DESCRIPTOR}`,
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    "GEO/SEO audit platform: URL in, GEO Score 0-100 and a full AI visibility report out.",
  // C16 (LND-8/PRC-8): base URL for the relative OG/Twitter/canonical URLs
  // emitted by the public pages (og.png + page paths). Fallback chain:
  // NEXT_PUBLIC_APP_URL → localhost (dev).
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
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
  // SHL-2: the plan pill needs real tier + usage; the layout resolves it once
  // and hands the Navbar a serializable value (it stays a sync component).
  const plan: NavPlan | null = session?.user?.id
    ? await resolveNavPlan(prisma, session.user.id, Date.now())
    : null;

  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${workSans.variable} ${jetBrainsMono.variable} antialiased`}
      >
        <Navbar session={session} plan={plan} />
        {children}
        <Footer session={session} />
      </body>
    </html>
  );
}
