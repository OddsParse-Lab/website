import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { ProjectExplorer } from "@/components/project-explorer";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return <SiteShell about><ProjectExplorer /></SiteShell>;
}
