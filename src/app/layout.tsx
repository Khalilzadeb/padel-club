import type { Metadata } from "next";
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
import { cookies } from "next/headers";
import { type Locale, VALID_LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PadelOn - Book Courts, Track Matches & Tournaments",
  description: "Your premier padel sports club. Book courts, track matches, and compete in tournaments.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
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
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900`}>
        <AuthProvider>
          <ThemeProvider>
            <LocaleProvider initialLocale={initialLocale}>
              <OnboardingGuard />
              <WelcomeGuide />
              <Navbar />
              <main className="flex-1 pb-16 md:pb-0">{children}</main>
              <Footer className="hidden md:block" />
              <BottomNav />
            </LocaleProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
