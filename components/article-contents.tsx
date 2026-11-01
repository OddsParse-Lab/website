"use client";

import { useEffect, useRef, useState } from "react";

type Section = { id: string; label: string };

export function ArticleContents({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  const disclosure = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const targets = sections.flatMap(section => {
      const element = document.getElementById(section.id);
      return element ? [{ id: section.id, element }] : [];
    });
    let frame = 0;
    function update() {
      frame = 0;
      let current = targets[0]?.id;
      for (const target of targets) {
        if (target.element.getBoundingClientRect().top <= 120) current = target.id;
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) current = targets.at(-1)?.id ?? current;
      setActive(current);
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    const body = document.getElementById("article-overview");
    if (body) observer.observe(body);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [sections]);

  function links() {
    return <ol className="journal-contents-list">
      {sections.map(section => <li key={section.id}>
        <a href={`#${section.id}`} aria-current={active === section.id ? "location" : undefined} onClick={() => {
          if (disclosure.current) disclosure.current.open = false;
          setActive(section.id);
        }}>{section.label}</a>
      </li>)}
    </ol>;
  }

  return <aside className="journal-contents">
    <nav className="journal-contents-desktop" aria-label="Article contents">
      <p className="journal-contents-label">On this page</p>
      {links()}
      <a href="#main" className="journal-top-link">Back to top <span aria-hidden="true">↑</span></a>
    </nav>
    <details className="journal-contents-mobile" ref={disclosure}>
      <summary>On this page <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></summary>
      <nav aria-label="Article contents">{links()}</nav>
    </details>
  </aside>;
}
