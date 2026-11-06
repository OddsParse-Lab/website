"use client";

import { useRef, type KeyboardEvent } from "react";
import Link from "next/link";
import { useProjectMotion } from "./use-project-motion";
import { projects } from "@/lib/projects";
import { ChronallaxPerformance } from "./chronallax-performance";

function ProjectDetails({ name }: { name: (typeof projects)[number]["name"] }) {
  if (name === "Chronallax") return <ChronallaxPerformance />;

  if (name === "Echo") return <>
    <div className="echo-result">
      <span className="result-label">Highest win rate</span>
      <p className="result-number">94.1<span>%</span></p>
      <span className="result-caption">Development-stage result</span>
    </div>
    <div className="project-note"><p><span>Research archived. Development discontinued.</span><br /><Link href="/blog/one-second-behind/">Read the postmortem</Link></p></div>
  </>;

  if (name === "Heimdall") return <>
    <div className="source-list" aria-label="Monitored sources"><span>Google News</span><span>Yahoo Finance</span><span>X</span><span>Reddit</span><span>+ more</span></div>
    <ol className="research-steps">
      <li><span className="step-number">01</span><div><h3>Collect</h3><p>Scheduled collection from news and social sources.</p></div></li>
      <li><span className="step-number">02</span><div><h3>Weigh</h3><p>Time-decayed information weighting.</p></div></li>
      <li><span className="step-number">03</span><div><h3>Interpret</h3><p>LLM analysis: relevance and priced-in signals.</p></div></li>
    </ol>
  </>;

  return <ol className="research-steps" aria-label="Market matching, monitoring, and trading workflow">
    <li><span className="step-number">01</span><div><h3>Discover</h3><p>Embedding models shortlist markets with similar underlying questions.</p></div></li>
    <li><span className="step-number">02</span><div><h3>Review</h3><p>LLMs compare resolution criteria to assess whether contracts refer to the same outcome.</p></div></li>
    <li><span className="step-number">03</span><div><h3>Monitor</h3><p>Track price spreads across matched markets as quotes change.</p></div></li>
    <li><span className="step-number">04</span><div><h3>Execute</h3><p>Place orders on matched markets across supported platforms.</p></div></li>
  </ol>;
}

export function ProjectExplorer() {
  const { selected, stageRef, explorerRef, selectProject } = useProjectMotion(projects.length);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function navigate(event: KeyboardEvent<HTMLButtonElement>) {
    let next = selected;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (selected + 1) % projects.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (selected + projects.length - 1) % projects.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = projects.length - 1;
    else return;
    event.preventDefault();
    selectProject(next);
    tabs.current[next]?.focus();
  }

  return <main ref={explorerRef} id="main" className="project-explorer">
    <div className="project-index">
      <div className="project-intro"><h1>Inside the lab.</h1><p>Exploring how markets<br /> move, react, and disagree.</p></div>
      <div className="project-tabs" role="tablist" aria-label="Research projects" aria-orientation="vertical">
        {projects.map((item, index) => <button key={item.name} ref={element => { tabs.current[index] = element; }} id={`project-tab-${index}`} type="button" role="tab" aria-selected={selected === index} aria-controls={`project-panel-${index}`} tabIndex={selected === index ? 0 : -1} className="project-tab" onClick={() => selectProject(index)} onKeyDown={navigate}>
          <span className="project-tab-number">0{index + 1}</span><span className="project-tab-text"><span className="project-tab-name">{item.name}</span><span className="project-tab-category">{item.category}</span></span>
        </button>)}
      </div>
    </div>
    <div className="project-stage" ref={stageRef}>
    {projects.map((item, index) => <section key={item.name} id={`project-panel-${index}`} role="tabpanel" aria-labelledby={`project-tab-${index}`} tabIndex={0} hidden={selected !== index} className="project-panel">
        <div className="project-panel-top"><span>{item.domain}</span><span className="project-counter">{String(index + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</span></div>
        <div className="project-heading"><h2>{item.name}</h2><span className="project-status-badge">{item.status}</span></div>
        <p className="project-description">{item.description}</p>
        <ProjectDetails name={item.name} />
    </section>)}
    </div>
  </main>;
}
