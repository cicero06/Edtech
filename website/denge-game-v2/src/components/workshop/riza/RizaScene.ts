/**
 * Bereket Vadisi — the 3D drip-irrigation diorama (three.js), the web
 * counterpart of Unity's RizaDiorama3DManager. A floating farm island with
 * a water tower + red main valve, a see-through cyclone sand filter, a
 * pressure regulator, three tomato rows (the third one up a slope), drip
 * lines with falling drops, a windmill, hay, pines and Farmer Rıza.
 *
 * The scene only *draws* a FarmState (sim.ts); clicks are reported back
 * through `onPick` and React owns the state.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MOISTURE_OK, flowing, type FarmState } from './sim';

export type PickId = 'valve' | 'filter' | 'regulator' | 'row0' | 'row1' | 'row2';
export type AnchorId = PickId | 'riza';

const ROW_Z = [-2.3, 0, 2.3] as const;
const ROW_X0 = -3.9;
const ROW_LEN = 7.4;
const SLOPE = 0.11; // third row climbs this many rad along +x
const PLANTS_PER_ROW = 7;

const C = {
  grass: 0x86c95a,
  grassDark: 0x6aa846,
  soilSide: 0x7a5232,
  soilDeep: 0x5c3b22,
  bedDry: new THREE.Color(0xb48a55),
  bedOk: new THREE.Color(0x5e3c22),
  bedWet: new THREE.Color(0x3a2a20),
  leafOk: new THREE.Color(0x3d9a48),
  leafDry: new THREE.Color(0xb8a24c),
  leafWet: new THREE.Color(0x2b5a33),
  steel: 0x9aa7b0,
  pipeDry: 0x5b6670,
  pipeWet: 0x3d8fd6,
};

interface Row {
  bed: THREE.Mesh;
  bedMat: THREE.MeshStandardMaterial;
  leafMat: THREE.MeshStandardMaterial;
  plants: THREE.Group[];
  line: THREE.Mesh;
  nozzles: THREE.Group;
  drops: THREE.Mesh[];
  puddle: THREE.Mesh;
  /** World position of each dripper along the row. */
  drippers: THREE.Vector3[];
}

export class RizaScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private pickables: { id: PickId; object: THREE.Object3D }[] = [];
  private anchors = new Map<AnchorId, THREE.Vector3>();
  private labels = new Map<AnchorId, HTMLElement>();
  private rows: Row[] = [];
  private valveWheel!: THREE.Group;
  private valveSpin = 0;
  private sediment!: THREE.Mesh;
  private filterGlass!: THREE.Mesh;
  private needle!: THREE.Object3D;
  private headerMat!: THREE.MeshStandardMaterial;
  private blades!: THREE.Group;
  private state: FarmState | null = null;
  private raf = 0;
  private clock = new THREE.Clock();
  private downAt: { x: number; y: number } | null = null;
  private hoverId: PickId | null = null;
  private resize: ResizeObserver;
  private host: HTMLElement;
  private onPick: (id: PickId) => void;

  constructor(host: HTMLElement, onPick: (id: PickId) => void) {
    this.host = host;
    this.onPick = onPick;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.touchAction = 'none';

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    this.camera.position.set(9.5, 9.5, 13.5);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.6, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 9;
    this.controls.maxDistance = 26;
    this.controls.maxPolarAngle = 1.32;
    this.controls.minPolarAngle = 0.35;

    this.buildSky();
    this.buildLights();
    this.buildIsland();
    this.buildRows();
    this.buildWaterworks();
    this.buildDecor();

    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.handleDown);
    el.addEventListener('pointerup', this.handleUp);
    el.addEventListener('pointermove', this.handleMove);

    this.resize = new ResizeObserver(() => this.fit());
    this.resize.observe(host);
    this.fit();
    this.loop();
  }

  // ---------------------------------------------------------------------------
  // public
  // ---------------------------------------------------------------------------

  setState(state: FarmState): void {
    const prev = this.state;
    this.state = state;
    if (prev && !prev.valveOpen && state.valveOpen) this.valveSpin = Math.PI * 2;
    this.applyState();
  }

  /** Floating HTML label pinned to a 3D anchor (positioned every frame). */
  attachLabel(id: AnchorId, el: HTMLElement | null): void {
    if (el) this.labels.set(id, el);
    else this.labels.delete(id);
  }

  resetView(): void {
    this.camera.position.set(9.5, 9.5, 13.5);
    this.controls.target.set(0, 0.6, 0);
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    this.resize.disconnect();
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.handleDown);
    el.removeEventListener('pointerup', this.handleUp);
    el.removeEventListener('pointermove', this.handleMove);
    this.controls.dispose();
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      for (const m of mats) {
        (m as THREE.MeshStandardMaterial).map?.dispose();
        m.dispose();
      }
    });
    this.renderer.dispose();
    el.remove();
  }

  // ---------------------------------------------------------------------------
  // build
  // ---------------------------------------------------------------------------

  private buildSky(): void {
    const c = document.createElement('canvas');
    c.width = 2;
    c.height = 256;
    const g = c.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#6fb8ea');
    grad.addColorStop(0.55, '#bfe3f7');
    grad.addColorStop(1, '#f6ead2');
    g.fillStyle = grad;
    g.fillRect(0, 0, 2, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.scene.background = tex;
  }

  private buildLights(): void {
    this.scene.add(new THREE.HemisphereLight(0xdff2ff, 0x6b5a3a, 1.1));
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.4);
    sun.position.set(-8, 14, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const s = sun.shadow.camera;
    s.left = -12;
    s.right = 12;
    s.top = 12;
    s.bottom = -12;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    this.scene.add(sun);
  }

  private mat(color: number | THREE.Color, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...extra });
  }

  private add(mesh: THREE.Mesh, parent: THREE.Object3D = this.scene, shadows = true): THREE.Mesh {
    mesh.castShadow = shadows;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private buildIsland(): void {
    // Layered soil block with a grass cap — the cut-away diorama look.
    const layers: [number, number, number][] = [
      [1.0, -1.35, C.soilDeep],
      [0.7, -0.5, C.soilSide],
    ];
    for (const [h, y, color] of layers) {
      const m = this.add(new THREE.Mesh(new THREE.BoxGeometry(16, h, 11.5), this.mat(color)), this.scene, false);
      m.position.y = y;
    }
    const grass = this.add(new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.3, 11.7), this.mat(C.grass)), this.scene, false);
    grass.position.y = -0.02;
    // A few darker grass tufts for texture.
    const tuft = new THREE.ConeGeometry(0.12, 0.3, 4);
    const tuftMat = this.mat(C.grassDark);
    for (let i = 0; i < 90; i++) {
      const x = (Math.random() - 0.5) * 15.4;
      const z = (Math.random() - 0.5) * 11;
      if (x > -4.6 && x < 4 && z > -3.2 && z < 3.4) continue; // keep the field clean
      const t = this.add(new THREE.Mesh(tuft, tuftMat), this.scene, false);
      t.position.set(x, 0.25, z);
    }
  }

  private buildRows(): void {
    const stem = new THREE.CylinderGeometry(0.04, 0.05, 0.6, 5);
    const leaf = new THREE.IcosahedronGeometry(0.26, 0);
    const fruit = new THREE.SphereGeometry(0.08, 8, 6);
    const fruitMat = this.mat(0xe2412f, { roughness: 0.5 });
    const stemMat = this.mat(0x4f7a2b);

    ROW_Z.forEach((z, r) => {
      const group = new THREE.Group();
      group.position.set(ROW_X0, r === 2 ? 0.28 : 0.14, z);
      if (r === 2) group.rotation.z = SLOPE;
      this.scene.add(group);

      if (r === 2) {
        // Grass ramp the third row climbs.
        const ramp = this.add(
          new THREE.Mesh(new THREE.BoxGeometry(ROW_LEN + 0.6, 0.9, 1.9), this.mat(C.grass)),
          this.scene,
          false,
        );
        ramp.position.set(ROW_X0 + ROW_LEN / 2, -0.18, z);
        ramp.rotation.z = SLOPE;
      }

      const bedMat = this.mat(C.bedDry.clone());
      const bed = this.add(new THREE.Mesh(new THREE.BoxGeometry(ROW_LEN, 0.22, 1.05), bedMat), group);
      bed.position.x = ROW_LEN / 2;
      this.pickables.push({ id: `row${r}` as PickId, object: bed });

      const leafMat = this.mat(C.leafDry.clone());
      const plants: THREE.Group[] = [];
      for (let i = 0; i < PLANTS_PER_ROW; i++) {
        const p = new THREE.Group();
        p.position.set(0.55 + i * ((ROW_LEN - 1.1) / (PLANTS_PER_ROW - 1)), 0.11, 0);
        const s = this.add(new THREE.Mesh(stem, stemMat), p);
        s.position.y = 0.3;
        for (const [lx, ly, lz] of [[0, 0.55, 0], [0.16, 0.4, 0.1], [-0.15, 0.42, -0.08]]) {
          const l = this.add(new THREE.Mesh(leaf, leafMat), p);
          l.position.set(lx, ly, lz);
        }
        for (const [fx, fy, fz] of [[0.2, 0.35, 0.18], [-0.18, 0.5, 0.14]]) {
          const f = this.add(new THREE.Mesh(fruit, fruitMat), p);
          f.position.set(fx, fy, fz);
        }
        group.add(p);
        plants.push(p);
      }

      // Drip line + emitters (hidden until laid).
      const line = this.add(
        new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, ROW_LEN, 6), this.mat(0x1d1f22, { roughness: 0.5 })),
        group,
      );
      line.rotation.z = Math.PI / 2;
      line.position.set(ROW_LEN / 2, 0.16, 0.38);
      line.visible = false;

      const nozzles = new THREE.Group();
      const goldMat = this.mat(0xf2c443, { metalness: 0.6, roughness: 0.3, emissive: 0x6a4a00, emissiveIntensity: 0.4 });
      for (let i = 0; i < PLANTS_PER_ROW; i++) {
        const n = this.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), goldMat), nozzles);
        n.position.set(0.55 + i * ((ROW_LEN - 1.1) / (PLANTS_PER_ROW - 1)), 0.2, 0.38);
      }
      nozzles.visible = false;
      group.add(nozzles);

      const dropMat = new THREE.MeshStandardMaterial({ color: 0x5cc8ff, transparent: true, opacity: 0.9, roughness: 0.1 });
      const drops: THREE.Mesh[] = [];
      const drippers: THREE.Vector3[] = [];
      for (let i = 0; i < PLANTS_PER_ROW; i++) {
        const local = new THREE.Vector3(0.55 + i * ((ROW_LEN - 1.1) / (PLANTS_PER_ROW - 1)), 0.2, 0.38);
        drippers.push(local);
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), dropMat);
        d.position.copy(local);
        d.visible = false;
        group.add(d);
        drops.push(d);
      }

      const puddle = new THREE.Mesh(
        new THREE.CircleGeometry(0.7, 20),
        new THREE.MeshStandardMaterial({ color: 0x4aa3d8, transparent: true, opacity: 0, roughness: 0.05, metalness: 0.2 }),
      );
      puddle.rotation.x = -Math.PI / 2;
      puddle.scale.set(ROW_LEN / 1.4, 1, 1);
      puddle.position.set(ROW_LEN / 2, 0.125, 0);
      group.add(puddle);

      this.rows.push({ bed, bedMat, leafMat, plants, line, nozzles, drops, puddle, drippers });
      // Stagger the label anchors along the rows so they never stack up.
      const along = [0.25, 0.55, 0.85][r];
      this.anchors.set(
        `row${r}` as PickId,
        new THREE.Vector3(ROW_X0 + ROW_LEN * along, 1.4 + (r === 2 ? along * ROW_LEN * Math.tan(SLOPE) + 0.2 : 0), z),
      );
    });
  }

  private pipe(from: THREE.Vector3, to: THREE.Vector3, r: number, material: THREE.Material): THREE.Mesh {
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();
    const m = this.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), material));
    m.position.copy(from).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return m;
  }

  private buildWaterworks(): void {
    const steel = this.mat(C.steel, { metalness: 0.5, roughness: 0.4, flatShading: false });
    this.headerMat = this.mat(C.pipeDry, { metalness: 0.3, roughness: 0.45, flatShading: false });

    // Water tower (back-left).
    const tower = new THREE.Group();
    tower.position.set(-6.4, 0, -4.1);
    this.scene.add(tower);
    for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) {
      const leg = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 6), this.mat(0x8a5a32)), tower);
      leg.position.set(x, 1.6, z);
    }
    const tank = this.add(new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 1.5, 16), this.mat(0x5fa3c9, { roughness: 0.6 })), tower);
    tank.position.y = 3.9;
    for (const y of [3.35, 4.45]) {
      const band = this.add(new THREE.Mesh(new THREE.TorusGeometry(1.07, 0.05, 6, 24), this.mat(0x3a4a55)), tower);
      band.rotation.x = Math.PI / 2;
      band.position.y = y;
    }
    const roof = this.add(new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.8, 16), this.mat(0xc9503d)), tower);
    roof.position.y = 5.05;
    this.anchors.set('valve', new THREE.Vector3(-5.2, 1.8, -3.0));

    // Down-pipe and main valve.
    this.pipe(new THREE.Vector3(-6.4, 3.2, -4.1), new THREE.Vector3(-6.4, 0.45, -4.1), 0.13, steel);
    this.pipe(new THREE.Vector3(-6.4, 0.45, -4.1), new THREE.Vector3(-5.3, 0.45, -3.1), 0.13, steel);
    const valve = new THREE.Group();
    valve.position.set(-5.25, 0.45, -3.05);
    this.scene.add(valve);
    const body = this.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), steel), valve);
    body.position.y = 0;
    const stemV = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 6), steel), valve);
    stemV.position.y = 0.4;
    this.valveWheel = new THREE.Group();
    this.valveWheel.position.y = 0.66;
    valve.add(this.valveWheel);
    const red = this.mat(0xd8352a, { roughness: 0.4 });
    const rim = this.add(new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 8, 20), red), this.valveWheel);
    rim.rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++) {
      const spoke = this.add(new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.05, 0.05), red), this.valveWheel);
      spoke.rotation.y = (i * Math.PI) / 3;
    }
    this.pickables.push({ id: 'valve', object: valve });

    // Valve -> cyclone sand filter.
    this.pipe(new THREE.Vector3(-5.05, 0.45, -2.9), new THREE.Vector3(-5.6, 0.45, -1.3), 0.12, steel);
    const filter = new THREE.Group();
    filter.position.set(-5.6, 0, -0.9);
    this.scene.add(filter);
    this.filterGlass = this.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 1.3, 20, 1, true),
        new THREE.MeshPhysicalMaterial({ color: 0xcfe9f5, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0, side: THREE.DoubleSide }),
      ),
      filter,
      false,
    );
    this.filterGlass.position.y = 1.15;
    const cone = this.add(new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.5, 20, 1, true), steel), filter);
    cone.rotation.x = Math.PI;
    cone.position.y = 0.25;
    const cap = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.14, 20), steel), filter);
    cap.position.y = 1.85;
    for (const y of [0.5, 1.8]) {
      const ring = this.add(new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.04, 6, 20), steel), filter);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
    }
    this.sediment = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1, 18), this.mat(0xc79a52)), filter, false);
    this.sediment.position.y = 0.5;
    this.pickables.push({ id: 'filter', object: filter });
    this.anchors.set('filter', new THREE.Vector3(-5.6, 2.4, -0.9));

    // Filter -> regulator -> header pipe feeding the rows.
    this.pipe(new THREE.Vector3(-5.6, 0.3, -0.6), new THREE.Vector3(-5.6, 0.3, 0.6), 0.12, steel);
    this.pipe(new THREE.Vector3(-5.6, 0.3, 0.6), new THREE.Vector3(-4.4, 0.3, 0.6), 0.12, steel);
    const header = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 6.2, 12), this.headerMat));
    header.rotation.x = Math.PI / 2;
    header.position.set(-4.3, 0.3, 0);

    const reg = new THREE.Group();
    reg.position.set(-4.95, 0.3, 0.6);
    this.scene.add(reg);
    const regBody = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 12), this.mat(0x2f6fb3, { roughness: 0.4 })), reg);
    regBody.position.y = 0.3;
    const dial = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 24), this.mat(0xf5f1e6, { flatShading: false })), reg);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0, 0.85, 0.05);
    const bezel = this.add(new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 6, 24), steel), reg);
    bezel.position.set(0, 0.85, 0.08);
    const green = this.add(new THREE.Mesh(new THREE.RingGeometry(0.17, 0.26, 16, 1, 1.2, 0.5), this.mat(0x3cbf6a)), reg, false);
    green.position.set(0, 0.85, 0.085);
    this.needle = new THREE.Group();
    this.needle.position.set(0, 0.85, 0.1);
    const nd = this.add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.24, 0.02), this.mat(0xc0281e)), this.needle as THREE.Group, false);
    nd.position.y = 0.11;
    reg.add(this.needle);
    this.pickables.push({ id: 'regulator', object: reg });
    this.anchors.set('regulator', new THREE.Vector3(-4.95, 1.5, 0.6));
  }

  private buildDecor(): void {
    // Windmill (back-right) with turning blades.
    const mill = new THREE.Group();
    mill.position.set(6.2, 0, -3.9);
    this.scene.add(mill);
    const tower = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.8, 3.4, 8), this.mat(0xe9dcc2)), mill);
    tower.position.y = 1.7;
    const top = this.add(new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.8, 8), this.mat(0x9c4a35)), mill);
    top.position.y = 3.8;
    this.blades = new THREE.Group();
    this.blades.position.set(0, 3.2, 0.62);
    mill.add(this.blades);
    for (let i = 0; i < 4; i++) {
      const b = this.add(new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.7, 0.04), this.mat(0xf6f0e2)), this.blades);
      b.position.y = 0.85;
      const pivot = new THREE.Group();
      pivot.rotation.z = (i * Math.PI) / 2;
      pivot.add(b);
      this.blades.add(pivot);
    }

    // Hay bales.
    const hay = this.mat(0xe2b94f);
    for (const [x, z, ry] of [[5.4, 2.6, 0.2], [6.3, 2.2, -0.4], [5.9, 3.4, 1.1]]) {
      const b = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.7, 14), hay));
      b.rotation.set(0, ry, Math.PI / 2);
      b.position.set(x, 0.55, z);
    }

    // Pines along the back and sides.
    const trunk = this.mat(0x6b4426);
    const needles = this.mat(0x2f7a43);
    const pine = (x: number, z: number, s: number) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.scale.setScalar(s);
      this.scene.add(g);
      const t = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.6, 6), trunk), g);
      t.position.y = 0.3;
      for (const [y, r, h] of [[0.9, 0.6, 1], [1.45, 0.48, 0.85], [1.95, 0.32, 0.7]]) {
        const c = this.add(new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), needles), g);
        c.position.y = y;
      }
    };
    for (const x of [-3.2, -1.2, 0.9, 2.9, 4.4]) pine(x + Math.random() * 0.4, -5.1, 0.95 + Math.random() * 0.3);
    for (const z of [3.6, 5.0]) pine(-7.2, z, 1);
    pine(7.3, 0.4, 1.1);

    // Fence along the front edge.
    const wood = this.mat(0xa77a4a);
    for (let x = -7.4; x <= 7.4; x += 1.1) {
      const post = this.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.1), wood));
      post.position.set(x, 0.4, 5.55);
    }
    for (const y of [0.35, 0.55]) {
      const rail = this.add(new THREE.Mesh(new THREE.BoxGeometry(15, 0.06, 0.06), wood));
      rail.position.set(0, y, 5.55);
    }

    // Farmer Rıza — a billboard of his illustration, standing by the rows.
    new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}assets/workshops/riza-farmer.webp`, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const aspect = tex.image.width / tex.image.height;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
      const h = 2.3;
      sprite.scale.set(h * aspect, h, 1);
      sprite.center.set(0.5, 0);
      sprite.position.set(4.6, 0.12, 0.9);
      this.scene.add(sprite);
      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.5, 16),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22 }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(4.6, 0.14, 0.9);
      this.scene.add(shadow);
    });
    this.anchors.set('riza', new THREE.Vector3(4.6, 2.7, 0.9));
  }

  // ---------------------------------------------------------------------------
  // state -> visuals
  // ---------------------------------------------------------------------------

  private applyState(): void {
    const s = this.state;
    if (!s) return;
    // Sand sits on the glass floor (y = 0.5) and fills up to 1 unit high.
    this.sediment.scale.y = Math.max(0.001, s.sediment);
    this.sediment.position.y = 0.5 + s.sediment / 2;
    this.headerMat.color.setHex(flowing(s) ? C.pipeWet : C.pipeDry);
    // Gauge: 0.5 bar → -120°, 3.0 bar → +120°.
    const t = (s.pressure - 0.5) / 2.5;
    this.needle.rotation.z = THREE.MathUtils.degToRad(120 - t * 240);

    this.rows.forEach((row, r) => {
      row.line.visible = s.pipes[r];
      row.nozzles.visible = r === 2 && s.pcNozzle;
      const m = s.moisture[r];
      // Soil darkens with water; leaves go from straw-yellow to green.
      const [lo, hi] = MOISTURE_OK;
      if (m < lo) {
        const k = (m - 0.2) / (lo - 0.2);
        row.bedMat.color.copy(C.bedDry).lerp(C.bedOk, Math.max(0, k));
        row.leafMat.color.copy(C.leafDry).lerp(C.leafOk, Math.max(0, k));
      } else if (m <= hi) {
        row.bedMat.color.copy(C.bedOk);
        row.leafMat.color.copy(C.leafOk);
      } else {
        const k = Math.min(1, (m - hi) / 0.2);
        row.bedMat.color.copy(C.bedOk).lerp(C.bedWet, k);
        row.leafMat.color.copy(C.leafOk).lerp(C.leafWet, k);
      }
      const puddleMat = row.puddle.material as THREE.MeshStandardMaterial;
      puddleMat.opacity = m > hi ? Math.min(0.6, (m - hi) * 3) : 0;
      const vigor = m < lo ? 0.72 + 0.28 * Math.max(0, (m - 0.2) / (lo - 0.2)) : 1;
      for (const p of row.plants) {
        p.scale.set(1, vigor, 1);
        p.rotation.z = m < lo ? (1 - vigor) * 0.9 : 0; // droop when dry
      }
    });
  }

  // ---------------------------------------------------------------------------
  // input
  // ---------------------------------------------------------------------------

  private pick(e: PointerEvent): PickId | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables.map((p) => p.object), true);
    if (!hits.length) return null;
    let o: THREE.Object3D | null = hits[0].object;
    while (o) {
      const found = this.pickables.find((p) => p.object === o);
      if (found) return found.id;
      o = o.parent;
    }
    return null;
  }

  private handleDown = (e: PointerEvent) => {
    this.downAt = { x: e.clientX, y: e.clientY };
  };

  private handleUp = (e: PointerEvent) => {
    if (!this.downAt) return;
    const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
    this.downAt = null;
    if (moved > 6) return; // it was an orbit drag
    const id = this.pick(e);
    if (id) this.onPick(id);
  };

  private handleMove = (e: PointerEvent) => {
    if (e.buttons) return;
    const id = this.pick(e);
    if (id !== this.hoverId) {
      this.hoverId = id;
      this.renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
    }
  };

  // ---------------------------------------------------------------------------
  // frame
  // ---------------------------------------------------------------------------

  private fit(): void {
    const w = this.host.clientWidth || 1;
    const h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    const time = this.clock.elapsedTime;
    this.controls.update();
    this.blades.rotation.z += dt * 0.9;

    if (this.valveSpin > 0) {
      const step = Math.min(this.valveSpin, dt * 9);
      this.valveWheel.rotation.y += step;
      this.valveSpin -= step;
    }

    const s = this.state;
    const isFlowing = !!s && flowing(s);
    this.rows.forEach((row, r) => {
      const on = isFlowing && !!s?.pipes[r];
      row.drops.forEach((d, i) => {
        d.visible = on;
        if (!on) return;
        const phase = (time * 1.4 + i * 0.37 + r * 0.21) % 1;
        const base = row.drippers[i];
        d.position.set(base.x, base.y - phase * 0.3, base.z);
        (d.material as THREE.MeshStandardMaterial).opacity = 0.9 * (1 - phase);
      });
      // Gentle sway so the field feels alive.
      row.plants.forEach((p, i) => {
        p.rotation.x = Math.sin(time * 1.3 + i + r) * 0.035;
      });
    });

    this.renderer.render(this.scene, this.camera);
    this.placeLabels();
  };

  private placeLabels(): void {
    if (!this.labels.size) return;
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    const v = new THREE.Vector3();
    for (const [id, el] of this.labels) {
      const anchor = this.anchors.get(id);
      if (!anchor) continue;
      v.copy(anchor).project(this.camera);
      const visible = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      el.style.opacity = visible ? '1' : '0';
      el.style.transform = `translate(-50%, -100%) translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`;
    }
  }
}
