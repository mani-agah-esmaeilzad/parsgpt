import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { getServerSession } from "next-auth";

import "./globals.css";

import { AuthProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";
import { authOptions } from "@/lib/auth/options";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["300", "900"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ChatPars",
  description: "نسخه فارسی‌سازی شده و مدیریتی شبیه ChatGPT برای تیم‌ها.",
};

export const viewport: Viewport = {
  initialScale: 1,
  userScalable: false,
  viewportFit: "cover",
  width: "device-width",
  interactiveWidget: "resizes-content"
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ChatPars" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${vazirmatn.variable} font-sans bg-background text-foreground`}>
        <AuthProvider session={session}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <ServiceWorker />
          </ThemeProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
