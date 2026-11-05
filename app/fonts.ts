import { Geist, Geist_Mono, Montserrat } from "next/font/google";

// Shared by the root layout and the Storybook preview.

export const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Display face for tool navigation (Figma: Montserrat Regular). Exposed as `font-display`. */
export const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const fontVariables = [geistSans.variable, geistMono.variable, montserrat.variable].join(
  " ",
);
