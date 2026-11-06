import { SiteShell } from "@/components/site-shell";
import { StructuredData } from "@/components/structured-data";
import { pageMetadata, pageSchema } from "@/lib/site";

const description = "About OddsParse Lab: prediction market research and trading, arbitrage, probabilistic pricing, market microstructure, and proprietary execution technology.";
export const metadata = pageMetadata("About - Quantitative Trading & Technology", description, "/about/");

export default function About() {
  return <SiteShell activePage="about">
    <StructuredData data={pageSchema("AboutPage", "About", description, "/about/")} />
    <main id="main" className="about-editorial">
      <div className="about-opening">
        <div className="about-statement">
          <h1>Quantitative trading<br /><em>and technology.</em></h1>
        </div>
        <p className="about-introduction">OddsParse Lab is an independent quantitative research and trading group focused primarily on prediction markets. Our work combines statistical modeling, machine learning, and proprietary software to understand market behavior and develop systematic trading strategies.</p>
      </div>

      <div className="about-activities">
        <section aria-labelledby="research-heading">
          <h2 id="research-heading">Quantitative research</h2>
          <p className="about-body">Our prediction-market research covers probabilistic pricing, arbitrage, market making, and cross-venue price discovery. We work with order books and transaction-level data to study information arrival, available liquidity, and the relationship between quoted prices and executable outcomes.</p>
          <p className="about-body">We have also explored equity factors and other traditional quantitative strategies, with particular attention to signal decay, turnover costs, and out-of-sample robustness.</p>
        </section>
        <section aria-labelledby="technology-heading">
          <h2 id="technology-heading">Trading and technology</h2>
          <p className="about-body">We develop our own data capture, order-book reconstruction, replay, and execution systems. Research draws on historical tests, paper and shadow trading, and selected live experiments to assess how strategies behave under actual market conditions.</p>
          <p className="about-body">We evaluate trading opportunities after fees and execution frictions, with explicit attention to differences in settlement rules.</p>
        </section>
      </div>
    </main>
  </SiteShell>;
}
