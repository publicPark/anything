import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { generateMetadata as generateI18nMetadata } from "@/lib/metadata-helpers";
import { defaultLocale } from "@/lib/i18n";
import CookieConsent from "@/components/CookieConsent";
import { ToastProvider } from "@/components/ui/Toast";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = generateI18nMetadata(defaultLocale);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID ? (
          <Script
            id="adsense-init"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        ) : null}
        <ThemeProvider>
          <ToastProvider>
            <Navigation />
            <main className="min-h-screen bg-background">{children}</main>
            <Footer />
          </ToastProvider>
        </ThemeProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
