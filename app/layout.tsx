import type { Metadata } from "next";

import { WebVitals } from "./_components/WebVitals";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wizard Tuner",
  description: "Wizard Tuner",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <WebVitals />
        {children}
      </body>
    </html>
  );
}
