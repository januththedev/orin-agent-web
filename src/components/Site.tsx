import { Nav } from './Nav';
import { Hero } from './Hero';
import { Products } from './Products';
import { SelfHost } from './SelfHost';
import { Footer } from './Footer';
import { Cursor } from './Cursor';

export function Site({ go }: { go: (to: string) => void }) {
  return (
    <>
      <div className="grain" aria-hidden="true" />
      <Nav />
      <main id="main">
        <Hero go={go} />
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            <span><b>plan</b> → act → approve → done</span><span>real tools</span><span>your machine</span><span>approvals enforced server-side</span><span>artifacts kept</span>
            <span><b>plan</b> → act → approve → done</span><span>real tools</span><span>your machine</span><span>approvals enforced server-side</span><span>artifacts kept</span>
          </div>
        </div>
        <Products />
        <SelfHost />
        <section className="block" aria-label="Trust">
          <div className="wrap">
            <p className="kicker">Trust model</p>
            <h2 className="sec-h2">Permissions live<br />in the backend.</h2>
            <p className="lead" style={{ marginTop: 16 }}>
              Read, write, execute, network, external action — allow, ask, or deny.
              The frontend is never the security boundary: the runtime enforces
              every permission and pauses for approval with impact shown.
            </p>
          </div>
        </section>
      </main>
      <Footer />
      <Cursor />
    </>
  );
}
