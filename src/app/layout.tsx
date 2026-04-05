import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import OnboardingGuard from "@/components/layout/OnboardingGuard";
import WelcomeGuide from "@/components/layout/WelcomeGuide";
import SiteTour from "@/components/layout/SiteTour";
import AppRefresh from "@/components/layout/AppRefresh";
import { cookies, headers } from "next/headers";
import { type Locale, VALID_LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.padelon.az";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#16a34a",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PadelOn",
  description: "Oyna, Reytinq qazan, Real səviyyəni tap. 🎾",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PadelOn",
    startupImage: "/icon-512.png",
  },
  openGraph: {
    title: "PadelOn",
    description: "Oyna, Reytinq qazan, Real səviyyəni tap. 🎾",
    url: siteUrl,
    siteName: "PadelOn",
    images: [{ url: "/icon-512.jpg", width: 512, height: 512, alt: "PadelOn" }],
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const initialLocale: Locale = (VALID_LOCALES as string[]).includes(rawLocale ?? '')
    ? (rawLocale as Locale)
    : DEFAULT_LOCALE;

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isVenueAdmin = pathname.startsWith("/venue-admin");

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-512.jpg" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900`}>
        <AuthProvider>
          <ThemeProvider>
            <LocaleProvider initialLocale={initialLocale}>
              {isVenueAdmin ? (
                <main className="flex-1">{children}</main>
              ) : (
                <>
                  <AppRefresh />
                  <OnboardingGuard />
                  <WelcomeGuide />
                  <SiteTour />
                  <Navbar />
                  <main className="flex-1 pb-20 md:pb-0">{children}</main>
                  <Footer />
                  <BottomNav />
                </>
              )}
            </LocaleProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
