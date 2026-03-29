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
import { cookies } from "next/headers";
import { type Locale, VALID_LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#16a34a",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PadelOn",
  description: "Padel oyunları, turnirler və reytinq",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PadelOn",
    startupImage: "/icon-512.png",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const initialLocale: Locale = (VALID_LOCALES as string[]).includes(rawLocale ?? '')
    ? (rawLocale as Locale)
    : DEFAULT_LOCALE;

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-512.png" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900`}>
        <AuthProvider>
          <ThemeProvider>
            <LocaleProvider initialLocale={initialLocale}>
              <AppRefresh />
              <OnboardingGuard />
              <WelcomeGuide />
              <SiteTour />
              <Navbar />
              <main className="flex-1 pb-20 md:pb-0">{children}</main>
              <Footer />
              <BottomNav />
            </LocaleProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
