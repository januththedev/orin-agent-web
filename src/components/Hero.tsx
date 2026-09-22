import { useEffect, useRef } from 'react';
import { Reveal } from './Reveal';

export function Hero({ go }: { go: (to: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    let scene: { dispose(): void } | null = null;
    let live = true;
    import('../three/nodes').then((m) => {
      if (!live || !canvasRef.current) return;
      const s = new m.NodesScene(canvasRef.current!);
      if (s.init()) scene = s;
      else canvasRef.current!.style.display = 'none';
    });
    return () => { live = false; scene?.dispose(); };
  }, []);

  return (
    <section className="hero" aria-label="Orin Agent introduction">
      <canvas id="gl" ref={canvasRef} aria-hidden="true" />
      <div className="hero-inner">
        <Reveal><p className="kicker">Orin Agent — autonomous task execution</p></Reveal>
        <Reveal delay={90}>
          <h1>Ask is cheap.<br /><span className="thin">Assign the work.</span></h1>
        </Reveal>
        <Reveal delay={180}>
          <p className="lead hero-sub">
            Orin Chat answers. Orin Agent <em>acts</em> — plans multi-step tasks,
            uses real tools, pauses for your approval, and delivers artifacts.
            On your machine, your models, your rules.
          </p>
        </Reveal>
        <Reveal delay={260}>
          <div className="hero-ctas">
            <button className="btn btn-solid" onClick={() => go('app')}>Open the workspace</button>
            <button className="btn btn-line" onClick={() => go('docs')}>How it works</button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
