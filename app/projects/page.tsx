import { SiteShell } from "@/components/site-shell";
import { pageMetadata } from "@/lib/site";
import { ProjectsRedirect } from "./redirect";

export const metadata = {
  ...pageMetadata("Strategies", "Explore OddsParse Lab’s quantitative trading strategies and research systems.", "/strategies/"),
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

// Vercel serves an HTTP redirect. This page keeps standalone static exports working.
export default function LegacyProjects() {
  return <SiteShell activePage="strategies">
    <ProjectsRedirect />
    <noscript><meta httpEquiv="refresh" content="0;url=/strategies/" /></noscript>
    <main id="main" className="strategy-redirect">
      <div><h1>Strategies.</h1><p>This page has moved to <a href="/strategies/">Strategies</a>.</p></div>
    </main>
  </SiteShell>;
}
