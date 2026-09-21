import { SiteShell } from "@/components/site-shell";
import { ProjectExplorer } from "@/components/project-explorer";
import { StructuredData } from "@/components/structured-data";
import { pageMetadata, pageSchema, site } from "@/lib/site";
import { projects } from "@/lib/projects";

const description = "Explore Echo, Heimdall, Torsion, and Parallax: proprietary prediction-market models, LLM market intelligence, US equities strategies, and automated arbitrage.";
export const metadata = pageMetadata("Quantitative Research Projects", description, "/projects/");

const structuredData = pageSchema("CollectionPage", "Projects", description, "/projects/");

export default function Projects() {
  return <SiteShell activePage="projects">
    <StructuredData data={{ ...structuredData, "@graph": [
      { ...structuredData["@graph"][0], mainEntity: { "@id": `${site.url}/projects/#research-projects` } },
      structuredData["@graph"][1],
      { "@type": "ItemList", "@id": `${site.url}/projects/#research-projects`, name: "OddsParse Lab research projects", numberOfItems: projects.length, itemListElement: projects.map((project, index) => ({ "@type": "ListItem", position: index + 1, item: { "@type": "CreativeWork", name: project.name, description: project.description, creator: { "@id": `${site.url}/#organization` } } })) },
    ] }} />
    <ProjectExplorer />
  </SiteShell>;
}
