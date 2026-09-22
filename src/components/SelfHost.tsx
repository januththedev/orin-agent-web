import { Reveal } from './Reveal';

export function SelfHost() {
  return (
    <section className="block" aria-label="Execution visibility">
      <div className="wrap">
        <Reveal>
          <p className="kicker">Always legible</p>
          <h2 className="sec-h2">Watch it think.<br />Stop it anytime.</h2>
        </Reveal>
        <Reveal>
          <ul className="timeline" aria-label="Example task lifecycle">
            <li className="done"><h4>Planning</h4><p>“Research competitors, draft the comparison, save a report.”</p></li>
            <li className="done"><h4>Searching web</h4><p>3 sources read, 2 kept, 1 discarded as stale.</p></li>
            <li className="done"><h4>Waiting for approval</h4><p>Wants to email 4 people. You allowed once.</p></li>
            <li className="done"><h4>Executing</h4><p>Draft written, tables built, file saved.</p></li>
            <li><h4>Completed</h4><p>Report delivered as an artifact. Verify, keep working, or done.</p></li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
