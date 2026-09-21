import { SiteShell } from "@/components/site-shell";
import { StructuredData } from "@/components/structured-data";
import { pageMetadata, pageSchema } from "@/lib/site";

const description = "Meet OddsParse Lab, an independent quantitative research and trading lab. Discover our mission, proprietary modeling approach, and focus on evidence and risk.";
export const metadata = pageMetadata("About - Quantitative Research & Trading", description, "/about/");

export default function About() {
  return <SiteShell activePage="about">
    <StructuredData data={pageSchema("AboutPage", "About", description, "/about/")} />
    <main id="main" className="about-editorial">
      <div className="about-opening">
        <div className="about-statement">
          <h1>Curiosity,<br /><em>made rigorous.</em></h1>
          <p>Independent research at the intersection<br className="about-line-break" /> of probability, information, and markets.</p>
        </div>
        <section className="about-mission" aria-labelledby="mission-heading">
          <h2 id="mission-heading" className="about-section-label"><span>01</span> Mission</h2>
          <p className="mission-statement">Understand the uncertainty.<br />Find what others overlook.</p>
          <p className="about-body">We study how markets absorb information and price the unknown. Our mission is to turn that curiosity into models, useful signals, and better decisions.</p>
        </section>
      </div>

      <div className="about-principles">
        <section aria-labelledby="approach-heading">
          <h2 id="approach-heading" className="about-section-label"><span>02</span> Approach</h2>
          <h3>Question. Build. Test.</h3>
          <p className="about-body">Start with a question. Build our own models. Test assumptions against data, study where they fail, and revise when the evidence changes.</p>
        </section>
        <section aria-labelledby="vision-heading">
          <h2 id="vision-heading" className="about-section-label"><span>03</span> Vision</h2>
          <h3>A lab that keeps learning.</h3>
          <p className="about-body">Bring quantitative research and machine intelligence into a continuous process of discovery, where every result informs the next question.</p>
        </section>
        <section aria-labelledby="objective-heading">
          <h2 id="objective-heading" className="about-section-label"><span>04</span> Objective</h2>
          <h3>An edge that holds up.</h3>
          <p className="about-body">Turn promising ideas into working systems. Measure performance alongside risk, and share live results as our projects mature.</p>
        </section>
      </div>

    </main>
  </SiteShell>;
}
