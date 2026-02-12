import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { getServerSession } from "next-auth";

import "./globals.css";

import { AuthProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { authOptions } from "@/lib/auth/options";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chatpars",
  description: "نسخه فارسی‌سازی شده و مدیریتی شبیه ChatGPT برای تیم‌ها.",
}

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
      <body className={`${vazirmatn.variable} font-sans`}>
        <AuthProvider session={session}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
