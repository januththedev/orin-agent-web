export function Footer() {
  return (
    <footer aria-label="Footer">
      <div className="wrap">
        <div className="f-grid">
          <div className="f-brand">
            <a className="brand" href="#/" aria-label="Orin Agent home">
              <span className="dot" aria-hidden="true" />
              ORIN&nbsp;AGENT
            </a>
            <p>Autonomous AI task execution on your infrastructure. Free, open source, made by Januth.</p>
          </div>
          <nav className="f-cols" aria-label="Footer">
            <div>
              <h4>Product</h4>
              <a href="#/app">App</a>
              <a href="#/docs">Docs</a>
              <a href="https://orinai.org">Ecosystem</a>
            </div>
            <div>
              <h4>Developers</h4>
              <a href="https://github.com/januththedev/orin-agent">Backend repo</a>
              <a href="https://github.com/januththedev/orin-agent-web">Web repo</a>
              <a href="https://tools.orinai.org">Orin Tools</a>
            </div>
            <div>
              <h4>Orin</h4>
              <a href="https://chat.orinai.org">Orin Chat</a>
              <a href="https://code.orinai.org">Orin Code</a>
              <a href="https://januth.dev">Januth</a>
            </div>
          </nav>
        </div>
        <div className="f-base">
          <span>© 2026 Orin Agent · MIT · Made by <a href="https://januth.dev">Januth</a></span>
          <span className="mono">assign · act · approve · done</span>
        </div>
      </div>
    </footer>
  );
}
