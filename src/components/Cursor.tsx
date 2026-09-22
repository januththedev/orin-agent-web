import { useEffect, useState } from 'react';

export function Cursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
    let raf = 0;
    let tx = -100, ty = -100, x = -100, y = -100;
    const onMove = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
      const t = e.target as HTMLElement | null;
      setHovering(!!t?.closest('a, button'));
    };
    const loop = () => {
      x += (tx - x) * 0.2; y += (ty - y) * 0.2;
      setPos({ x, y });
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={`cursor${hovering ? ' hovering' : ''}`} aria-hidden="true">
      <div className="cursor-dot" style={{ left: pos.x, top: pos.y }} />
      <div className="cursor-ring" style={{ left: pos.x, top: pos.y }} />
    </div>
  );
}
