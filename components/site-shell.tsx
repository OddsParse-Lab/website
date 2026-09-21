import Link from "next/link";

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function SiteShell({ children, about = false }: { children: React.ReactNode; about?: boolean }) {
  return <div className="site-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="OddsParse Lab home">
        <svg className="brand-mark" width="25" height="25" viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" strokeDasharray="14 4.85" transform="rotate(-45 16 16)" /><path d="m9 21 5-9 4 7 5-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span>OddsParse <span className="wordmark-lab">Lab</span></span>
      </Link>
      <nav className="main-nav" aria-label="Main navigation">
        <Link href="/" className="nav-link" aria-current={!about ? "page" : undefined}>Home</Link>
        <Link href="/about" className="nav-link" aria-current={about ? "page" : undefined}>About</Link>
      </nav>
    </header>
    {children}
    <footer className="site-footer"><span>© {new Date().getFullYear()} OddsParse Lab</span><span className="footer-topics">Probability <span>·</span> Markets <span>·</span> Research</span></footer>
  </div>;
}
