import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChatFlow",
  description: "Real-time chat — Next.js 14 · MongoDB · Pusher",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} h-full bg-[#111118]`}>{children}</body>
    </html>
  );
}
