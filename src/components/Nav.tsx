import { useEffect, useState } from 'react';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open ]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className={`nav${scrolled ? ' scrolled' : ''}`}>
        <nav className="nav-inner" aria-label="Primary">
          <a className="brand" href="#/" aria-label="Orin Agent home">
            <span className="dot" aria-hidden="true" />
            ORIN&nbsp;AGENT
          </a>
          <div className="nav-links">
            <a href="#/app">App</a>
            <a href="#/docs">Docs</a>
            <a href="https://github.com/januththedev/orin-agent">GitHub</a>
            <a className="nav-cta" href="#/app">Get Started</a>
          </div>
          <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">Menu</button>
        </nav>
      </header>
      <div className={`mobile-nav${open ? ' open' : ''}`} role="dialog" aria-label="Site navigation">
        <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close menu">Close</button>
        {[['', 'Home'], ['app', 'App'], ['docs', 'Docs']].map(([to, label]) => (
          <a key={to} href={`#/${to}`} onClick={() => setOpen(false)}>{label}</a>
        ))}
        <a href="https://github.com/januththedev/orin-agent">GitHub</a>
      </div>
    </>
  );
}
