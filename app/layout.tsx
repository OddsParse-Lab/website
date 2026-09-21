import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "OddsParse Lab - An edge in uncertainty", template: "%s - OddsParse Lab" },
  description: "An independent financial research lab exploring markets through probability, data, and a healthy degree of skepticism.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<Analytics /></body></html>;
}
