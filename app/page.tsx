import Link from "next/link";
import { Arrow, SiteShell } from "@/components/site-shell";
import { ResearchGraphic } from "@/components/research-graphic";

export default function Home() {
  return <SiteShell>
    <ResearchGraphic />
    <main id="main" className="hero">
      <p className="eyebrow">Independent financial research</p>
      <h1>An edge in uncertainty.</h1>
      <p className="hero-description">Markets are noisy. We look for the signal.<br /> Exploring probability, risk, and the patterns in between.</p>
      <Link href="/about" className="primary-link">Inside OddsParse Lab <Arrow /></Link>
    </main>
  </SiteShell>;
}
