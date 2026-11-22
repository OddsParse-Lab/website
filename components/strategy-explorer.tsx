"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { useStrategyWheel } from "./use-strategy-wheel";
import { wheelAppearance, wheelDistance } from "@/lib/strategy-wheel";
import { strategies } from "@/lib/strategies";
import { ChronallaxPerformance } from "./chronallax-performance";
import { AnachronPerformance } from "./anachron-performance";

function StrategyDetails({ name, active }: { name: (typeof strategies)[number]["name"]; active: boolean }) {
  if (name === "Anachron") return <AnachronPerformance active={active} />;
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

  if (name === "Parallax") return <ol className="research-steps" aria-label="Market matching, monitoring, and trading workflow">
    <li><span className="step-number">01</span><div><h3>Discover</h3><p>Embedding models shortlist markets with similar underlying questions.</p></div></li>
    <li><span className="step-number">02</span><div><h3>Review</h3><p>LLMs compare resolution criteria to assess whether contracts refer to the same outcome.</p></div></li>
    <li><span className="step-number">03</span><div><h3>Monitor</h3><p>Track price spreads across matched markets as quotes change.</p></div></li>
    <li><span className="step-number">04</span><div><h3>Execute</h3><p>Place orders on matched markets across supported platforms.</p></div></li>
  </ol>;

  return null;
}

export function StrategyExplorer() {
  const { rootRef, itemRefs, selection } = useStrategyWheel(strategies.length);
  const stageRef = useRef<HTMLDivElement>(null);
  const initial = useRef(true);
  const selected = selection.index;

  useLayoutEffect(() => {
    if (initial.current) { initial.current = false; return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const panel = stageRef.current?.querySelector<HTMLElement>("section:not([hidden])");
    const animation = panel?.animate([
      { opacity: 0, transform: `translateY(${selection.direction * 64}px)` },
      { opacity: 1, transform: "translateY(0)" },
    ], { duration: 440, easing: "cubic-bezier(.22,.65,.25,1)" });
    return () => animation?.cancel();
  }, [selection]);

  return <main id="main" className="strategy-lab">
    <h1 className="sr-only">Trading strategies and research systems</h1>
    <div className="strategy-selector">
      <div ref={rootRef} className="strategy-wheel" role="tablist" aria-label="Trading strategies and research systems" aria-orientation="vertical" aria-describedby="wheel-instructions" tabIndex={-1}>
        <div className="strategy-wheel-guide" aria-hidden="true"><span /></div>
        {strategies.map((item, index) => {
          const appearance = wheelAppearance(wheelDistance(index, 0, strategies.length));
          return <button key={item.name} ref={element => { itemRefs.current[index] = element; }} id={`project-tab-${index}`} data-wheel-index={index} type="button" role="tab" aria-selected={selected === index} aria-controls={`project-panel-${index}`} tabIndex={selected === index ? 0 : -1} className="strategy-wheel-item" style={{ "--wheel-type-scale": appearance.scale.toFixed(4), transform: `translate(calc(var(--wheel-step) * ${appearance.x.toFixed(4)}), calc(var(--wheel-step) * ${appearance.y.toFixed(4)} - 50%)) rotate(${appearance.angle.toFixed(4)}deg)`, opacity: appearance.opacity, filter: appearance.blur < .01 ? "none" : `blur(${appearance.blur.toFixed(4)}px)` } as CSSProperties}>
            <span className="strategy-wheel-number">{String(index + 1).padStart(2, "0")}</span><span>{item.name}</span>
          </button>;
        })}
      </div>
      <p className="strategy-wheel-hint" id="wheel-instructions"><svg viewBox="0 0 16 20" fill="none" aria-hidden="true"><path d="m5 5 3-3 3 3M8 2v16m-3-3 3 3 3-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /></svg>Drag or scroll to explore</p>
    </div>
    <div className="strategy-stage" ref={stageRef}>
      {strategies.map((item, index) => <section key={item.name} id={`project-panel-${index}`} role="tabpanel" aria-labelledby={`project-tab-${index}`} tabIndex={0} hidden={selected !== index} aria-hidden={selected !== index} inert={selected !== index} className="project-panel">
        <div className="project-panel-top"><span>{item.domain}</span><span className="project-counter">{String(index + 1).padStart(2, "0")} / {String(strategies.length).padStart(2, "0")}</span></div>
        <div className="project-heading"><h2>{item.name}</h2>{item.status && <span className="project-status-badge" data-status={item.status.toLowerCase()}>{item.status}</span>}</div>
        <p className="project-description">{item.description}</p>
        <StrategyDetails name={item.name} active={selected === index} />
      </section>)}
    </div>
  </main>;
}
