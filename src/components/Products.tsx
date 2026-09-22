import { Reveal } from './Reveal';

const CAPS: Array<[string, string]> = [
  ['Plan', 'Breaks your goal into steps it can actually execute.'],
  ['Act', 'Browser, terminal, files, APIs — tools run for real.'],
  ['Ask', 'Pauses for approval with impact shown. Allow once, always, deny.'],
  ['Deliver', 'Artifacts you can preview, open, copy and keep working on.'],
];

export function Products() {
  return (
    <section className="block" aria-label="Capabilities">
      <div className="wrap">
        <Reveal>
          <p className="kicker">What it does</p>
          <h2 className="sec-h2">One task in.<br />Done work out.</h2>
        </Reveal>
        <div className="grid3">
          {CAPS.map(([h, p], i) => (
            <Reveal key={h} delay={i * 80}>
              <div className="card">
                <span className="ic" aria-hidden="true">{['◈', '⬢', '⬣', '⬔'][i]}</span>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
