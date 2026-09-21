import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, SiteShell } from "@/components/site-shell";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return <SiteShell about>
    <main id="main" className="hero about-content">
      <p className="eyebrow">OddsParse Lab</p>
      <h1>A closer look. Soon.</h1>
      <p className="hero-description">An independent perspective on probability and markets.<br /> More about the lab is on its way.</p>
      <Link href="/" className="primary-link">Back to home <Arrow /></Link>
    </main>
  </SiteShell>;
}
