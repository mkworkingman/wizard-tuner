import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { WebVitals } from "./_components/web-vitals";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wizard Tuner",
  description: "Wizard Tuner",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <WebVitals />
        {children}
      </body>
    </html>
  );
}
