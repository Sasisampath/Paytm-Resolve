import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { SplashGate } from "@/components/splash/splash-gate";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Paytm Resolve",
  description:
    "Hackathon prototype by Team PaytmKaro: help merchants handle payment issues. Not an official Paytm product.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

// Runs before first paint: if the splash already played this session, hide it
// immediately so returning visits never flash it.
const splashGuard = `try{if(sessionStorage.getItem("resolve-splash-done"))document.documentElement.dataset.splash="done"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: splashGuard }} />
      </head>
      <body className="min-h-full">
        <SplashGate />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
