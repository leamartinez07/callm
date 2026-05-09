import type { Metadata } from "next";
import { Geist, Syne } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/hooks/useLocale";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const syne  = Syne({ variable: "--font-syne",  subsets: ["latin"], weight: ["700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: "callm",
  description: "Real-time chat, direct messages & video calls — Next.js 15 · MongoDB · Pusher · WebRTC",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${syne.variable} font-geist h-full bg-surface`}>
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
