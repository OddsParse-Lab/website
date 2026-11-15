import { SiteShell } from "@/components/site-shell";
import { StrategyExplorer } from "@/components/strategy-explorer";
import { StructuredData } from "@/components/structured-data";
import { pageMetadata, pageSchema, site } from "@/lib/site";
import { strategies } from "@/lib/strategies";

const description = "Explore OddsParse Lab’s market-making and arbitrage engines, probabilistic pricing models, and research systems for prediction markets.";
export const metadata = pageMetadata("Quantitative Trading Strategies", description, "/strategies/");

const structuredData = pageSchema("CollectionPage", "Strategies", description, "/strategies/");

export default function Strategies() {
  return <SiteShell activePage="strategies">
    <StructuredData data={{ ...structuredData, "@graph": [
      { ...structuredData["@graph"][0], mainEntity: { "@id": `${site.url}/strategies/#strategies` } },
      structuredData["@graph"][1],
      { "@type": "ItemList", "@id": `${site.url}/strategies/#strategies`, name: "OddsParse Lab strategies and research systems", numberOfItems: strategies.length, itemListElement: strategies.map((project, index) => ({ "@type": "ListItem", position: index + 1, item: { "@type": "CreativeWork", name: project.name, description: project.description, creativeWorkStatus: project.status ?? undefined, creator: { "@id": `${site.url}/#organization` } } })) },
    ] }} />
    <StrategyExplorer />
  </SiteShell>;
}
