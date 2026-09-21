import Link from "next/link";
import { Arrow, SiteShell } from "@/components/site-shell";
import { ResearchGraphic } from "@/components/research-graphic";
import { StructuredData } from "@/components/structured-data";
import { pageMetadata, site } from "@/lib/site";

export const metadata = pageMetadata("OddsParse Lab - An edge in uncertainty", site.description, "/");

export default function Home() {
  return <SiteShell>
    <StructuredData data={{ "@context": "https://schema.org", "@type": "WebSite", "@id": `${site.url}/#website`, name: site.name, alternateName: site.alternateName, url: `${site.url}/`, description: site.description, inLanguage: "en", publisher: { "@id": `${site.url}/#organization` } }} />
    <ResearchGraphic />
    <main id="main" className="hero">
      <h1>An edge in uncertainty.</h1>
      <p className="hero-description">Markets are noisy. We look for the signal.<br /> Exploring probability, risk, and the patterns in between.</p>
      <Link href="/about" className="primary-link">Inside OddsParse Lab <Arrow /></Link>
    </main>
  </SiteShell>;
}
