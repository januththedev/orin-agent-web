import * as THREE from 'three';

/**
 * Systems motif: plan node fanning to tool nodes, converging on done.
 * Same performance contract as the ecosystem hero (capability, DPR cap,
 * reduced motion, pause offscreen, dispose).
 */
const NODES: Array<[number, number, number]> = [
  [0, 3.2, 0],          // plan
  [-3.4, 0.4, 0], [-1.1, 0.4, 0], [1.1, 0.4, 0], [3.4, 0.4, 0], // tools
  [0, -2.6, 0],         // done
];
const EDGES: Array<[number, number]> = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 5], [3, 5], [4, 5]];

export class NodesScene {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private group: THREE.Group | null = null;
  private frame = 0;
  private visible = true;
  private disposed = false;
  private mx = 0; private my = 0; private tx = 0; private ty = 0;
  private onMove = (e: PointerEvent) => {
    this.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    this.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  private onResize = () => this.resize();
  private io: IntersectionObserver | null = null;

  static supported(): boolean {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch { return false; }
  }

  constructor(private canvas: HTMLCanvasElement) {}

  init(): boolean {
    if (this.disposed) return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (!NodesScene.supported()) return false;
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    this.camera.position.z = 11;
    this.group = new THREE.Group();

    const lime = new THREE.Color(0xbef264);
    const dim = new THREE.Color(0x3f3f46);
    NODES.forEach(([x, y, z], i) => {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(i === 0 || i === NODES.length - 1 ? 0.22 : 0.14, 24, 24),
        new THREE.MeshBasicMaterial({ color: i === 0 ? lime : dim, transparent: true, opacity: 0.95 }),
      );
      s.position.set(x, y, z);
      this.group!.add(s);
    });
    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 24, 24),
      new THREE.MeshBasicMaterial({ color: lime, transparent: true, opacity: 0.35 }),
    );
    pulse.name = 'pulse';
    this.group.add(pulse);

    const pts: number[] = [];
    EDGES.forEach(([a, b]) => {
      pts.push(...NODES[a], ...NODES[b]);
    });
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    this.group.add(new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0x52525b, transparent: true, opacity: 0.8 })));

    // ambient dust
    const dust = new Float32Array(240 * 3);
    for (let i = 0; i < 240; i++) {
      dust[i * 3] = (Math.random() - 0.5) * 20;
      dust[i * 3 + 1] = (Math.random() - 0.5) * 12;
      dust[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
    this.group.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.05, color: 0x71717a, transparent: true, opacity: 0.6 })));

    this.scene.add(this.group);
    window.addEventListener('pointermove', this.onMove, { passive: true });
    window.addEventListener('resize', this.onResize);
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; });
    if (this.canvas.parentElement) this.io.observe(this.canvas.parentElement);
    this.resize();
    this.tick();
    return true;
  }

  private resize(): void {
    if (!this.renderer || !this.camera || !this.canvas.parentElement) return;
    const w = this.canvas.parentElement.clientWidth;
    const h = this.canvas.parentElement.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private tick = (): void => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.tick);
    if (!this.visible || !this.renderer || !this.scene || !this.camera || !this.group) return;
    this.mx += (this.tx - this.mx) * 0.04;
    this.my += (this.ty - this.my) * 0.04;
    const t = performance.now() * 0.001;
    this.group.rotation.y = this.mx * 0.35;
    this.group.rotation.x = this.my * 0.2;
    const pulse = this.group.getObjectByName('pulse');
    if (pulse) {
      // packet traveling plan → tools → done along edges
      const phase = (t * 0.35) % 3;
      const seg = Math.min(2, Math.floor(phase));
      const f = phase - seg;
      const paths = [[NODES[0], NODES[2]], [NODES[2], NODES[5]], [NODES[5], NODES[5]]];
      const [a, b] = paths[seg] ?? paths[0];
      pulse.position.set(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, 0);
      const s = 1 + Math.sin(t * 4) * 0.15;
      pulse.scale.set(s, s, s);
    }
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('resize', this.onResize);
    this.io?.disconnect();
    this.group?.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const mat = mesh.material as THREE.Material | undefined;
      mat?.dispose?.();
    });
    this.renderer?.dispose();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.group = null;
  }
}
