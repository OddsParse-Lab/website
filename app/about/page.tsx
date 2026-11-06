import { SiteShell } from "@/components/site-shell";
import { StructuredData } from "@/components/structured-data";
import { pageMetadata, pageSchema } from "@/lib/site";

const description = "OddsParse Lab combines proprietary quantitative research with a Rust trading engine, microsecond decision latency, and prediction market execution technology.";
export const metadata = pageMetadata("About - Quantitative Trading & Technology", description, "/about/");

export default function About() {
  return <SiteShell activePage="about">
    <StructuredData data={pageSchema("AboutPage", "About", description, "/about/")} />
    <main id="main" className="about-editorial">
      <div className="about-opening">
        <div className="about-statement">
          <h1>Quantitative trading<br /><em>and technology.</em></h1>
        </div>
        <p className="about-introduction">OddsParse Lab is an independent quantitative research and trading group building an edge in prediction markets. We combine original models, machine learning, and high-performance engineering to turn market complexity into systematic trading opportunities.</p>
      </div>

      <div className="about-activities">
        <section aria-labelledby="research-heading">
          <h2 id="research-heading">Quantitative research</h2>
          <p className="about-body">We develop proprietary models for probabilistic pricing, arbitrage, and market making. Our research examines how information moves, how liquidity forms, and where pricing relationships break down to uncover opportunities within market structure.</p>
          <p className="about-body">Our work also extends to equity factors and traditional systematic strategies. Across these areas, we pursue original signals and models that can be translated into live trading, with prediction markets as our primary focus.</p>
        </section>
        <section aria-labelledby="technology-heading">
          <h2 id="technology-heading">Performance engineering</h2>
          <p className="about-body">Our proprietary Rust trading engine delivers microsecond decision latency and millisecond order latency at the median, while monitoring nearly 100,000 markets in parallel.</p>
          <p className="about-body">We develop the critical components in-house, from market-data processing and strategy evaluation to order execution. This gives us the control to optimize the trading stack around our models and bring new research into production.</p>
        </section>
      </div>
    </main>
  </SiteShell>;
}
