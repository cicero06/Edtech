/**
 * Belediye Meclis Salonu — Tam Ekran Three.js 3B Meclis Oturumu Sahnesi.
 *
 * Kasabadaki saha karakterleri yerine resmi Belediye Meclisi Komisyon
 * Başkanları (Bütçe, Su İdaresi, Çevre/Kırsal, Sosyal İşler) ve Belediye
 * Başkanı Adil yarım daire meclis sıralarında yer alır.
 *
 * Sahne 3B modelleri (takım elbiseli/ceketli meclis üyeleri, masa mikrofonları,
 * elektronik oylama lambaları, başkanlık kürsüsü ve tokmağı, ortadaki 3B
 * holografik kasaba strateji masası) ve kamera geçişlerini ('debate', 'podium',
 * 'voting') yönetir.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { SolutionId } from '../../../Game/scenario/model';

export type CouncilMemberId =
  | 'mayor'
  | 'budget'
  | 'water'
  | 'ecology'
  | 'social';

export type CouncilCameraMode = 'overview' | 'speaker' | 'podium' | 'voting';

export type VoteLampState = 'idle' | 'yes' | 'caution';

export interface CouncilVisualState {
  pickedIds: string[];
  remainingBudget: number;
  reservoirBefore: number;
  reservoirAfter: number;
  activeSpeaker: CouncilMemberId;
  cameraMode: CouncilCameraMode;
  votes: Record<CouncilMemberId, VoteLampState>;
  gavelStrikeCount: number;
}

interface OfficialRig {
  id: CouncilMemberId;
  root: THREE.Group;
  head: THREE.Group;
  rightArm: THREE.Group;
  gavelArm?: THREE.Group;
  micLed: THREE.Mesh;
  voteOrb: THREE.Mesh;
  deskHalo: THREE.Mesh;
  baseY: number;
  seatPos: THREE.Vector3;
  phase: number;
}

const CAMERA_PRESETS: Record<
  Exclude<CouncilCameraMode, 'speaker'>,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  overview: { pos: [0, 7.2, 11.4], target: [0, 1.35, -0.8] },
  podium: { pos: [0, 4.4, 6.8], target: [0, 1.85, -3.4] },
  voting: { pos: [0, 8.1, 10.2], target: [0, 1.4, -1.2] },
};

const VOTE_COLORS: Record<VoteLampState, number> = {
  idle: 0x475569,
  yes: 0x22c55e,
  caution: 0xf59e0b,
};

export class MayorCouncilScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private pickables: {
    kind: 'solution' | 'member';
    solutionId?: SolutionId;
    memberId?: CouncilMemberId;
    object: THREE.Object3D;
  }[] = [];
  private anchors = new Map<CouncilMemberId, THREE.Vector3>();
  private labels = new Map<CouncilMemberId, HTMLElement>();
  private officials = new Map<CouncilMemberId, OfficialRig>();

  // Tabletop miniature meshes
  private pipeMesh!: THREE.Mesh;
  private leakRing!: THREE.Mesh;
  private farmGroup!: THREE.Group;
  private farmLeaves: THREE.Mesh[] = [];
  private rainTanksGroup!: THREE.Group;
  private fountainJet!: THREE.Mesh;
  private homesGlowGroup!: THREE.Group;
  private reservoirWater!: THREE.Mesh;
  private holoRing!: THREE.Mesh;

  private desiredCamPos = new THREE.Vector3(0, 7.2, 11.4);
  private desiredTarget = new THREE.Vector3(0, 1.35, -0.8);
  private userOrbiting = false;
  private lastGavelCount = 0;
  private gavelTimer = 0;

  private state: CouncilVisualState = {
    pickedIds: [],
    remainingBudget: 1_000_000,
    reservoirBefore: 40,
    reservoirAfter: 40,
    activeSpeaker: 'mayor',
    cameraMode: 'overview',
    votes: {
      mayor: 'idle',
      budget: 'idle',
      water: 'idle',
      ecology: 'idle',
      social: 'idle',
    },
    gavelStrikeCount: 0,
  };

  private raf = 0;
  private clock = new THREE.Clock();
  private downAt: { x: number; y: number } | null = null;
  private resize: ResizeObserver;
  private host: HTMLElement;
  private onToggleSolution: (id: SolutionId) => void;
  private onSelectMember: (id: CouncilMemberId) => void;

  constructor(
    host: HTMLElement,
    onToggleSolution: (id: SolutionId) => void,
    onSelectMember: (id: CouncilMemberId) => void,
  ) {
    this.host = host;
    this.onToggleSolution = onToggleSolution;
    this.onSelectMember = onSelectMember;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.touchAction = 'none';

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 150);
    this.camera.position.copy(this.desiredCamPos);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(this.desiredTarget);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 5.8;
    this.controls.maxDistance = 17.5;
    this.controls.maxPolarAngle = 1.38;
    this.controls.minPolarAngle = 0.35;
    this.controls.minAzimuthAngle = -1.05;
    this.controls.maxAzimuthAngle = 1.05;

    this.controls.addEventListener('start', () => {
      this.userOrbiting = true;
    });

    this.buildAtmosphere();
    this.buildLights();
    this.buildChamberArchitecture();
    this.buildCouncilBenchesAndPodium();
    this.buildTabletopTownMiniature();
    this.buildCouncilOfficials();

    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.handleDown);
    el.addEventListener('pointerup', this.handleUp);
    el.addEventListener('pointermove', this.handleMove);

    this.resize = new ResizeObserver(() => this.fit());
    this.resize.observe(host);
    this.fit();
    this.applyState();
    this.loop();
  }

  setState(next: CouncilVisualState): void {
    if (next.gavelStrikeCount !== this.lastGavelCount) {
      this.lastGavelCount = next.gavelStrikeCount;
      this.gavelTimer = 0.65;
    }
    if (
      next.cameraMode !== this.state.cameraMode ||
      next.activeSpeaker !== this.state.activeSpeaker
    ) {
      this.userOrbiting = false;
    }
    this.state = next;
    this.applyState();
  }

  attachLabel(id: CouncilMemberId, el: HTMLElement | null): void {
    if (el) this.labels.set(id, el);
    else this.labels.delete(id);
  }

  resetView(): void {
    this.userOrbiting = false;
    this.desiredCamPos.set(...CAMERA_PRESETS.overview.pos);
    this.desiredTarget.set(...CAMERA_PRESETS.overview.target);
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    this.resize.disconnect();
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.handleDown);
    el.removeEventListener('pointerup', this.handleUp);
    el.removeEventListener('pointermove', this.handleMove);
    this.controls.dispose();
    this.renderer.dispose();
    el.remove();
  }

  // ---------------------------------------------------------------------------
  // Scene Construction
  // ---------------------------------------------------------------------------

  private mat(color: number, roughness = 0.6, metalness = 0.1): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness });
  }

  private add<T extends THREE.Object3D>(obj: T, parent: THREE.Object3D = this.scene): T {
    obj.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    parent.add(obj);
    return obj;
  }

  private buildAtmosphere(): void {
    this.scene.background = new THREE.Color(0x0f1c24);
    this.scene.fog = new THREE.FogExp2(0x0f1c24, 0.018);
  }

  private buildLights(): void {
    this.scene.add(new THREE.HemisphereLight(0xfff5e0, 0x1a2c38, 0.9));

    const key = new THREE.DirectionalLight(0xfff2d6, 1.5);
    key.position.set(6, 12, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const sc = key.shadow.camera;
    sc.near = 1;
    sc.far = 32;
    sc.left = -10;
    sc.right = 10;
    sc.top = 10;
    sc.bottom = -10;
    key.shadow.bias = -0.0005;
    this.scene.add(key);

    const holoLight = new THREE.PointLight(0x38bdf8, 1.25, 9);
    holoLight.position.set(0, 2.6, 0.4);
    this.scene.add(holoLight);

    const podiumLight = new THREE.PointLight(0xfbbf24, 1.15, 8);
    podiumLight.position.set(0, 4.2, -3.5);
    this.scene.add(podiumLight);
  }

  private buildChamberArchitecture(): void {
    // Grand circular marble floor
    const floor = this.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(8.8, 9.2, 0.36, 56),
        this.mat(0xd8d0c0, 0.4, 0.12),
      ),
    );
    floor.position.y = -0.18;

    // Inner dark slate inlay circle
    const innerFloor = this.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(5.6, 5.6, 0.02, 48),
        this.mat(0x1e293b, 0.5, 0.15),
      ),
    );
    innerFloor.position.y = 0.01;

    // Gold parliamentary ring
    const goldRing = new THREE.Mesh(
      new THREE.RingGeometry(5.52, 5.72, 56),
      this.mat(0xeab308, 0.3, 0.65),
    );
    goldRing.rotation.x = -Math.PI / 2;
    goldRing.position.y = 0.025;
    this.scene.add(goldRing);

    // Ceremonial red runner carpet from entrance to podium
    const carpet = this.add(
      new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.03, 8.2), this.mat(0x991b1b, 0.85, 0.02)),
    );
    carpet.position.set(0, 0.02, 0.6);

    // Raised presidential dais at the back
    const dais = this.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(3.8, 4.0, 0.38, 36, 1, false, -Math.PI * 0.5, Math.PI),
        this.mat(0x452715, 0.5, 0.1),
      ),
    );
    dais.rotation.y = Math.PI;
    dais.position.set(0, 0.19, -2.5);

    // Semicircular acoustic wood-slat parliamentary wall
    const wall = this.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(8.1, 8.1, 5.2, 44, 1, true, Math.PI * 0.58, Math.PI * 0.84),
        new THREE.MeshStandardMaterial({
          color: 0x2c1d12,
          roughness: 0.55,
          metalness: 0.1,
          side: THREE.DoubleSide,
        }),
      ),
    );
    wall.position.y = 2.6;

    // Marble pilasters / columns along the chamber wall
    const colMat = this.mat(0xf1ece1, 0.4, 0.1);
    const goldMat = this.mat(0xd97706, 0.3, 0.6);
    for (const angle of [-1.05, -0.55, 0, 0.55, 1.05]) {
      if (angle === 0) continue;
      const r = 7.65;
      const x = Math.sin(angle) * r;
      const z = -Math.cos(angle) * r;
      const col = this.add(
        new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 4.9, 16), colMat),
      );
      col.position.set(x, 2.45, z);
      const cap = this.add(new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.24, 0.76), goldMat));
      cap.position.set(x, 0.12, z);
    }

    // Back wall Municipal Crest & "DENGE BELEDİYE MECLİSİ" gold emblem
    const crestDisc = this.add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.09, 36), goldMat),
    );
    crestDisc.rotation.x = Math.PI / 2;
    crestDisc.position.set(0, 3.65, -7.7);

    // Twin official flags flanking Mayor Adil
    const flagColors = [0xdc2626, 0x0284c7];
    [-2.1, 2.1].forEach((x, idx) => {
      const pole = this.add(
        new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.8, 10), goldMat),
      );
      pole.position.set(x, 2.05, -4.8);
      const banner = this.add(
        new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.45, 0.05), this.mat(flagColors[idx], 0.55)),
      );
      banner.position.set(x, 2.7, -4.75);
    });
  }

  private buildCouncilBenchesAndPodium(): void {
    const mahogany = this.mat(0x5c3419, 0.42, 0.14);
    const darkWood = this.mat(0x361e0d, 0.52, 0.1);
    const goldMat = this.mat(0xf59e0b, 0.28, 0.65);

    // Mayor's Presidential Podium Desk
    const podium = new THREE.Group();
    podium.position.set(0, 0.38, -3.55);
    this.scene.add(podium);

    const pBody = this.add(
      new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.1, 1.0), mahogany),
      podium,
    );
    pBody.position.y = 0.55;
    const pTop = this.add(
      new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.12, 1.15), darkWood),
      podium,
    );
    pTop.position.y = 1.14;
    const seal = this.add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 24), goldMat),
      podium,
    );
    seal.rotation.x = Math.PI / 2;
    seal.position.set(0, 0.62, 0.52);

    // Gavel sound block on Mayor's desk
    const soundBlock = this.add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.06, 16), darkWood),
      podium,
    );
    soundBlock.position.set(0.55, 1.22, 0.15);

    // Central Holographic Strategy Table
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0, 0.45);
    this.scene.add(tableGroup);

    const pedestal = this.add(
      new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.85, 0.82, 36), darkWood),
      tableGroup,
    );
    pedestal.position.y = 0.41;

    const tableRim = this.add(
      new THREE.Mesh(new THREE.CylinderGeometry(2.75, 2.65, 0.14, 40), mahogany),
      tableGroup,
    );
    tableRim.position.y = 0.88;

    this.holoRing = new THREE.Mesh(
      new THREE.RingGeometry(2.12, 2.32, 48),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
      }),
    );
    this.holoRing.rotation.x = -Math.PI / 2;
    this.holoRing.position.set(0, 0.96, 0.45);
    this.scene.add(this.holoRing);
  }

  private buildTabletopTownMiniature(): void {
    const base = new THREE.Group();
    base.position.set(0, 0.96, 0.45);
    this.scene.add(base);

    // Miniature terrain disc
    const island = this.add(
      new THREE.Mesh(new THREE.CylinderGeometry(2.08, 2.12, 0.08, 36), this.mat(0x4d8b3c, 0.7)),
      base,
    );
    island.position.y = 0.04;

    // 1. Reservoir / Dam at North
    const damWall = this.add(
      new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.28, 0.18), this.mat(0x94a3b8, 0.5)),
      base,
    );
    damWall.position.set(0, 0.18, -1.22);

    this.reservoirWater = this.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(1.22, 0.22, 0.52),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.15 }),
      ),
      base,
    );
    this.reservoirWater.position.set(0, 0.14, -1.52);

    // 2. Main Pipe & Leak ('repair-pipes')
    const pipeGroup = new THREE.Group();
    base.add(pipeGroup);
    this.pipeMesh = this.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.075, 1.75, 12),
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.35 }),
      ),
      pipeGroup,
    );
    this.pipeMesh.rotation.z = Math.PI / 2;
    this.pipeMesh.position.set(0.32, 0.14, -0.35);

    this.leakRing = new THREE.Mesh(
      new THREE.RingGeometry(0.14, 0.28, 20),
      new THREE.MeshBasicMaterial({ color: 0xf87171, side: THREE.DoubleSide }),
    );
    this.leakRing.rotation.x = -Math.PI / 2;
    this.leakRing.position.set(0.45, 0.1, -0.35);
    pipeGroup.add(this.leakRing);
    this.pickables.push({ kind: 'solution', solutionId: 'repair-pipes', object: pipeGroup });

    // 3. Agriculture Drip Rows ('drip-irrigation')
    this.farmGroup = new THREE.Group();
    this.farmGroup.position.set(-1.08, 0.08, 0.15);
    base.add(this.farmGroup);
    for (let r = -1; r <= 1; r++) {
      const bed = this.add(
        new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.06, 0.18), this.mat(0x6d4c30)),
        this.farmGroup,
      );
      bed.position.set(0, 0.03, r * 0.28);
      for (let p = -1; p <= 1; p++) {
        const leaf = this.add(
          new THREE.Mesh(
            new THREE.SphereGeometry(0.085, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xb8a24c, roughness: 0.55 }),
          ),
          this.farmGroup,
        );
        leaf.position.set(p * 0.25, 0.11, r * 0.28);
        this.farmLeaves.push(leaf);
      }
    }
    this.pickables.push({ kind: 'solution', solutionId: 'drip-irrigation', object: this.farmGroup });

    // 4. Park Fountain ('fountains-off')
    const parkGroup = new THREE.Group();
    parkGroup.position.set(0, 0.08, 0.22);
    base.add(parkGroup);
    const basin = this.add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.12, 18), this.mat(0xcbd5e1)),
      parkGroup,
    );
    basin.position.y = 0.06;
    this.fountainJet = this.add(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.14, 0.42, 12),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 }),
      ),
      parkGroup,
    );
    this.fountainJet.position.y = 0.3;
    this.pickables.push({ kind: 'solution', solutionId: 'fountains-off', object: parkGroup });

    // 5. Rain Harvest Tanks ('rain-harvest')
    this.rainTanksGroup = new THREE.Group();
    this.rainTanksGroup.position.set(0.55, 0.08, 0.85);
    base.add(this.rainTanksGroup);
    for (const dx of [-0.18, 0.18]) {
      const tank = this.add(
        new THREE.Mesh(
          new THREE.CylinderGeometry(0.13, 0.13, 0.32, 14),
          new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.3 }),
        ),
        this.rainTanksGroup,
      );
      tank.position.set(dx, 0.16, 0);
    }
    this.pickables.push({
      kind: 'solution',
      solutionId: 'rain-harvest',
      object: this.rainTanksGroup,
    });

    // 6. Residential Houses ('saving-campaign')
    this.homesGlowGroup = new THREE.Group();
    this.homesGlowGroup.position.set(1.12, 0.08, -0.1);
    base.add(this.homesGlowGroup);
    for (const [dx, dz] of [
      [-0.2, -0.22],
      [0.2, -0.22],
      [0, 0.22],
    ]) {
      const walls = this.add(
        new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.28), this.mat(0xfef3c7)),
        this.homesGlowGroup,
      );
      walls.position.set(dx, 0.12, dz);
      const roof = this.add(
        new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.18, 4), this.mat(0xb91c1c)),
        this.homesGlowGroup,
      );
      roof.rotation.y = Math.PI / 4;
      roof.position.set(dx, 0.33, dz);
    }
    this.pickables.push({
      kind: 'solution',
      solutionId: 'saving-campaign',
      object: this.homesGlowGroup,
    });
  }

  /**
   * Builds 5 distinct 3D Municipality Officials in formal council attire
   * (Başkan Adil + 4 Commission Heads), each at their own parliamentary desk
   * with microphone, laptop/folder, and electronic voting orb.
   */
  private buildCouncilOfficials(): void {
    const specs: {
      id: CouncilMemberId;
      pos: [number, number, number];
      lookAt: [number, number, number];
      suitColor: number;
      tieColor: number;
      hairColor: number;
      skinColor: number;
      hasGlasses?: boolean;
      hasBun?: boolean;
      isMayor?: boolean;
    }[] = [
      {
        id: 'mayor',
        pos: [0, 0.38, -4.15],
        lookAt: [0, 0.8, 2.0],
        suitColor: 0x1e293b, // Navy presidential suit
        tieColor: 0xdc2626, // Crimson tie
        hairColor: 0xd1d5db, // Distinguished silver hair
        skinColor: 0xf1c29b,
        hasGlasses: true,
        isMayor: true,
      },
      {
        id: 'budget',
        pos: [-3.65, 0, -1.45],
        lookAt: [0, 0.8, 0.45],
        suitColor: 0x334155, // Charcoal suit — Mali Hizmetler & Bütçe Başkanı Selim Bey
        tieColor: 0xeab308, // Gold tie
        hairColor: 0x27272a,
        skinColor: 0xeab68c,
        hasGlasses: true,
      },
      {
        id: 'water',
        pos: [-2.85, 0, 1.85],
        lookAt: [0, 0.8, 0.45],
        suitColor: 0x1e3a5f, // Deep slate blue — SUKİ Müdürü Hakan Bey
        tieColor: 0x06b6d4, // Cyan tie
        hairColor: 0x452c1e,
        skinColor: 0xf1c29b,
      },
      {
        id: 'ecology',
        pos: [3.65, 0, -1.45],
        lookAt: [0, 0.8, 0.45],
        suitColor: 0x065f46, // Emerald formal blazer — Çevre & Kırsal Başkanı Zeynep Hanım
        tieColor: 0xfef3c7, // Pearl scarf/blouse
        hairColor: 0x5c2d16,
        skinColor: 0xf5cba7,
        hasBun: true,
      },
      {
        id: 'social',
        pos: [2.85, 0, 1.85],
        lookAt: [0, 0.8, 0.45],
        suitColor: 0x7f1d1d, // Burgundy formal blazer — Sosyal İşler Başkanı Leyla Hanım
        tieColor: 0xfde68a, // Gold lapel/blouse
        hairColor: 0x1f1610,
        skinColor: 0xeab68c,
        hasBun: true,
      },
    ];

    specs.forEach((sp, idx) => {
      const group = new THREE.Group();
      group.position.set(...sp.pos);
      group.lookAt(...sp.lookAt);
      this.scene.add(group);

      // Individual Council Desk & Chair for the 4 commission heads
      if (!sp.isMayor) {
        const desk = this.add(
          new THREE.Mesh(
            new THREE.BoxGeometry(1.45, 0.86, 0.65),
            this.mat(0x56321a, 0.45, 0.12),
          ),
          group,
        );
        desk.position.set(0, 0.43, 0.58);

        const deskTop = this.add(
          new THREE.Mesh(
            new THREE.BoxGeometry(1.55, 0.08, 0.74),
            this.mat(0x361e0d, 0.5, 0.1),
          ),
          group,
        );
        deskTop.position.set(0, 0.89, 0.58);

        // Open laptop / dossier on council desk
        const folder = this.add(
          new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.3), this.mat(0xf8fafc, 0.7)),
          group,
        );
        folder.position.set(0.18, 0.94, 0.52);

        // Leather high-back council chair behind member
        const chair = this.add(
          new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.55, 0.18), this.mat(0x1e3a2f, 0.6)),
          group,
        );
        chair.position.set(0, 0.85, -0.34);
      }

      // Gooseneck microphone & glowing LED tip
      const micZ = sp.isMayor ? 0.45 : 0.48;
      const micY = sp.isMayor ? 1.18 : 0.93;
      const micStem = this.add(
        new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.34, 8), this.mat(0x1f2937)),
        group,
      );
      micStem.position.set(-0.22, micY + 0.16, micZ);
      micStem.rotation.x = -0.28;

      const micLed = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0x64748b }),
      );
      micLed.position.set(-0.22, micY + 0.33, micZ - 0.05);
      group.add(micLed);

      // Electronic Parliamentary Voting Lamp Orb on desk front
      const voteOrb = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 16, 16),
        new THREE.MeshBasicMaterial({ color: VOTE_COLORS.idle }),
      );
      voteOrb.position.set(0.38, micY + 0.1, micZ + 0.12);
      group.add(voteOrb);

      // Glowing floor/desk halo showing active speaker
      const deskHalo = new THREE.Mesh(
        new THREE.RingGeometry(0.68, 0.85, 32),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0,
        }),
      );
      deskHalo.rotation.x = -Math.PI / 2;
      deskHalo.position.set(0, 0.03, 0);
      group.add(deskHalo);

      // 3D Stylized Official Figure
      const figure = new THREE.Group();
      group.add(figure);

      // Torso (Suit jacket)
      const torso = this.add(
        new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.34, 0.95, 16),
          this.mat(sp.suitColor, 0.55),
        ),
        figure,
      );
      torso.position.y = 1.05;

      // Shirt & Tie / Scarf front
      const tie = this.add(
        new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.52, 0.08), this.mat(sp.tieColor, 0.4)),
        figure,
      );
      tie.position.set(0, 1.12, 0.27);

      // Shoulders
      const shoulders = this.add(
        new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.22, 0.36), this.mat(sp.suitColor, 0.55)),
        figure,
      );
      shoulders.position.set(0, 1.42, 0);

      // Left Arm (resting on desk)
      const leftArm = new THREE.Group();
      leftArm.position.set(0.38, 1.38, 0);
      figure.add(leftArm);
      const lSleeve = this.add(
        new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.55, 10), this.mat(sp.suitColor)),
        leftArm,
      );
      lSleeve.position.set(0, -0.22, 0.18);
      lSleeve.rotation.x = -0.75;

      // Right Arm (gestures when speaking / raises when voting!)
      const rightArm = new THREE.Group();
      rightArm.position.set(-0.38, 1.38, 0);
      figure.add(rightArm);
      const rSleeve = this.add(
        new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.56, 10), this.mat(sp.suitColor)),
        rightArm,
      );
      rSleeve.position.set(0, -0.22, 0.18);
      rSleeve.rotation.x = -0.7;
      const rHand = this.add(
        new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), this.mat(sp.skinColor)),
        rightArm,
      );
      rHand.position.set(0, -0.44, 0.36);

      // If Mayor, attach wooden gavel in right hand
      let gavelArm: THREE.Group | undefined;
      if (sp.isMayor) {
        gavelArm = rightArm;
        const handle = this.add(
          new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 8), this.mat(0x78350f)),
          rightArm,
        );
        handle.position.set(0, -0.44, 0.5);
        handle.rotation.x = Math.PI / 2;
        const headM = this.add(
          new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 12), this.mat(0x451a03)),
          rightArm,
        );
        headM.position.set(0, -0.44, 0.64);
        headM.rotation.z = Math.PI / 2;
      }

      // Head Group
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.82, 0);
      figure.add(headGroup);

      const headMesh = this.add(
        new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 20), this.mat(sp.skinColor, 0.5)),
        headGroup,
      );
      headMesh.scale.set(1, 1.08, 0.98);

      // Hair cap
      const hair = this.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.275, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
          this.mat(sp.hairColor, 0.7),
        ),
        headGroup,
      );
      hair.position.y = 0.04;
      hair.rotation.x = -0.18;

      if (sp.hasBun) {
        const bun = this.add(
          new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), this.mat(sp.hairColor, 0.7)),
          headGroup,
        );
        bun.position.set(0, 0.12, -0.25);
      }

      // Eyes
      const eyeMat = this.mat(0x111827, 0.2);
      for (const ex of [-0.09, 0.09]) {
        const eye = this.add(new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), eyeMat), headGroup);
        eye.position.set(ex, 0.03, 0.235);
      }

      // Glasses
      if (sp.hasGlasses) {
        const frameMat = this.mat(0xd97706, 0.2, 0.8);
        for (const gx of [-0.095, 0.095]) {
          const rim = new THREE.Mesh(new THREE.RingGeometry(0.042, 0.055, 16), frameMat);
          rim.position.set(gx, 0.03, 0.255);
          headGroup.add(rim);
        }
      }

      const worldAnchor = new THREE.Vector3(sp.pos[0], sp.pos[1] + 2.45, sp.pos[2]);
      this.anchors.set(sp.id, worldAnchor);

      this.officials.set(sp.id, {
        id: sp.id,
        root: figure,
        head: headGroup,
        rightArm,
        gavelArm,
        micLed,
        voteOrb,
        deskHalo,
        baseY: 0,
        seatPos: new THREE.Vector3(...sp.pos),
        phase: idx * 1.3,
      });

      this.pickables.push({ kind: 'member', memberId: sp.id, object: group });
    });
  }

  // ---------------------------------------------------------------------------
  // State -> Visuals & Camera Targets
  // ---------------------------------------------------------------------------

  private applyState(): void {
    const picked = new Set(this.state.pickedIds);

    // Update 3D tabletop miniature
    const pipeRepaired = picked.has('repair-pipes');
    (this.pipeMesh.material as THREE.MeshStandardMaterial).color.setHex(
      pipeRepaired ? 0x22c55e : 0xef4444,
    );
    this.leakRing.visible = !pipeRepaired;

    const dripOn = picked.has('drip-irrigation');
    for (const leaf of this.farmLeaves) {
      (leaf.material as THREE.MeshStandardMaterial).color.setHex(dripOn ? 0x22c55e : 0xb8a24c);
      leaf.scale.setScalar(dripOn ? 1.25 : 0.92);
    }

    this.fountainJet.visible = !picked.has('fountains-off');
    this.rainTanksGroup.scale.setScalar(picked.has('rain-harvest') ? 1.28 : 0.8);
    this.homesGlowGroup.scale.setScalar(picked.has('saving-campaign') ? 1.18 : 0.95);

    const pct = Math.max(15, Math.min(95, this.state.reservoirAfter));
    this.reservoirWater.scale.y = pct / 55;

    // Update officials' microphones, voting orbs, and halos
    for (const [id, rig] of this.officials) {
      const isSpeaker = this.state.activeSpeaker === id;
      (rig.micLed.material as THREE.MeshBasicMaterial).color.setHex(
        isSpeaker ? 0x22c55e : 0x64748b,
      );
      (rig.deskHalo.material as THREE.MeshBasicMaterial).opacity = isSpeaker ? 0.65 : 0;

      const voteState = this.state.votes[id] ?? 'idle';
      (rig.voteOrb.material as THREE.MeshBasicMaterial).color.setHex(VOTE_COLORS[voteState]);
      rig.voteOrb.scale.setScalar(voteState === 'idle' ? 0.85 : 1.35);
    }

    // Update desired camera target based on cameraMode
    if (this.state.cameraMode === 'speaker') {
      const speakerRig = this.officials.get(this.state.activeSpeaker);
      if (speakerRig) {
        const p = speakerRig.seatPos;
        this.desiredTarget.set(p.x * 0.55, 1.5, p.z * 0.55 - 0.5);
        this.desiredCamPos.set(p.x * 0.75, 5.2, 8.8);
      }
    } else {
      const preset = CAMERA_PRESETS[this.state.cameraMode];
      this.desiredCamPos.set(...preset.pos);
      this.desiredTarget.set(...preset.target);
    }
  }

  // ---------------------------------------------------------------------------
  // Pointer Picking
  // ---------------------------------------------------------------------------

  private hitTest(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(
      this.pickables.map((p) => p.object),
      true,
    );
    if (!hits.length) return null;
    let o: THREE.Object3D | null = hits[0].object;
    while (o) {
      const found = this.pickables.find((p) => p.object === o);
      if (found) return found;
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
    if (moved > 6) return;
    const hit = this.hitTest(e);
    if (!hit) return;
    if (hit.kind === 'solution' && hit.solutionId) {
      this.onToggleSolution(hit.solutionId);
    } else if (hit.kind === 'member' && hit.memberId) {
      this.onSelectMember(hit.memberId);
    }
  };

  private handleMove = (e: PointerEvent) => {
    if (e.buttons) return;
    const hit = this.hitTest(e);
    this.renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
  };

  // ---------------------------------------------------------------------------
  // Animation Loop
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

    if (!this.userOrbiting) {
      this.camera.position.lerp(this.desiredCamPos, dt * 3.2);
      this.controls.target.lerp(this.desiredTarget, dt * 3.8);
    }
    this.controls.update();

    if (this.gavelTimer > 0) {
      this.gavelTimer = Math.max(0, this.gavelTimer - dt);
    }

    for (const [id, rig] of this.officials) {
      const isSpeaker = this.state.activeSpeaker === id;
      const voteState = this.state.votes[id] ?? 'idle';

      // Head nodding & speaking gesture
      rig.head.rotation.x = isSpeaker
        ? Math.sin(time * 7.5 + rig.phase) * 0.09
        : Math.sin(time * 1.6 + rig.phase) * 0.025;
      rig.head.rotation.y = isSpeaker
        ? Math.cos(time * 4.2 + rig.phase) * 0.12
        : Math.sin(time * 0.9 + rig.phase) * 0.05;

      // Right arm animation: gavel strike, voting hand raise, or speaking gesture
      if (id === 'mayor' && this.gavelTimer > 0) {
        rig.rightArm.rotation.x = -0.35 + Math.sin(this.gavelTimer * Math.PI * 6) * 0.55;
      } else if (voteState !== 'idle') {
        rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -1.45, dt * 6);
      } else if (isSpeaker) {
        rig.rightArm.rotation.x = -0.55 + Math.sin(time * 6.5) * 0.25;
      } else {
        rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, 0, dt * 5);
      }
    }

    this.holoRing.rotation.z = time * 0.3;

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
