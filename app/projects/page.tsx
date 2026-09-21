import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { ProjectExplorer } from "@/components/project-explorer";

export const metadata: Metadata = {
  title: "Projects",
  description: "Explore Echo, Heimdall, Torsion, and Parallax: research in prediction markets, market intelligence, quantitative strategies, and arbitrage.",
};

export default function Projects() {
  return <SiteShell activePage="projects"><ProjectExplorer /></SiteShell>;
}
