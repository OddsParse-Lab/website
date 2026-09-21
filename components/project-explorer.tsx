"use client";

import { useRef, type KeyboardEvent } from "react";
import { useProjectMotion } from "./use-project-motion";

const projects = [
  { name: "Echo", category: "Prediction models", domain: "Prediction markets", description: "An in-house model for prediction markets. The approach stays private while development continues." },
  { name: "Heimdall", category: "Market intelligence", domain: "News & language models", description: "Monitoring market news and using LLMs to understand what matters, how fresh it is, and whether it is already priced in." },
  { name: "Torsion", category: "Intraday strategies", domain: "US equities", description: "Our own intraday model and strategy, designed in-house and inspired by opening-range breakout and rubber-band concepts." },
  { name: "Parallax", category: "Automated arbitrage", domain: "Kalshi · Limitless", description: "Risk-free arbitrage between Kalshi and Limitless, powered by proprietary semantic market matching and fully automated trading." },
] as const;

function ProjectDetails({ selected }: { selected: number }) {
  if (selected === 0) return <>
    <div className="echo-result">
      <span className="result-label">Highest win rate</span>
      <p className="result-number">94.1<span>%</span></p>
      <span className="result-caption">Development-stage result</span>
    </div>
    <div className="project-note"><p>Live performance data will be published here.<br /><span>Still in development. Stay tuned.</span></p></div>
  </>;

  if (selected === 1) return <>
    <div className="source-list" aria-label="Monitored sources"><span>Google News</span><span>Yahoo Finance</span><span>X</span><span>Reddit</span><span>+ more</span></div>
    <ol className="research-steps">
      <li><span className="step-number">01</span><div><h3>Collect</h3><p>Scheduled collection from news and social sources.</p></div></li>
      <li><span className="step-number">02</span><div><h3>Weigh</h3><p>Time-decayed information weighting.</p></div></li>
      <li><span className="step-number">03</span><div><h3>Interpret</h3><p>LLM analysis: relevance and priced-in signals.</p></div></li>
    </ol>
  </>;

  if (selected === 2) return <>
    <div className="strategy-results">
      <div><span className="result-label">Combined annualized return</span><p className="result-number">30<span>+%</span></p></div>
      <div><span className="result-label">Maximum drawdown</span><p className="result-number"><span className="result-approx">≈</span>17<span>%</span></p></div>
    </div>
    <div className="project-note"><p>A proprietary quantitative model.<br /><span>Independent strategy design for US intraday trading.</span></p></div>
  </>;

  return <>
    <div className="echo-result">
      <span className="result-label">Average profit per trade</span>
      <p className="result-number">5.07<span>%</span></p>
    </div>
    <div className="project-note"><p>Semantic market matching.<br /><span>From matching markets to executing trades, fully automated.</span></p></div>
  </>;
}

export function ProjectExplorer() {
  const { selected, stageRef, explorerRef, selectProject } = useProjectMotion(projects.length);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const project = projects[selected];

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
      {selected === index && <>
        <div className="project-panel-top"><span>{project.domain}</span><span className="project-counter">0{selected + 1} / 04</span></div>
        <div className="project-heading"><h2>{project.name}</h2>{selected === 0 && <span className="development-badge">In development</span>}</div>
        <p className="project-description">{project.description}</p>
        <ProjectDetails selected={selected} />
      </>}
    </section>)}
    </div>
  </main>;
}
