/**
 * Belediye Meclis Salonu & Başkanlık Makamı — Three.js 3D Sahnesi.
 *
 * Oyuncu belediye toplantısına girdiğinde Başkan Adil ve 4 bölge temsilcisi
 * (Mühendis Aylin, Çiftçi Rıza, Nuri Amca, İşçi Kemal) ile Rehber Lina
 * oyuncuyu 3B meclis salonunda karşılar.
 *
 * U-tipi meclis masasının ortasındaki 3B Kasaba Strateji Maketi, seçilen
 * çözüm paketlerine (`pickedIds`) göre gerçek zamanlı olarak aydınlanır;
 * masadaki bölgelere veya meclis üyelerine tıklayarak da kararlar
 * açılıp kapatılabilir.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { SolutionId } from '../../../Game/scenario/model';

export type CouncilAnchorId =
  | 'mayor'
  | 'aylin'
  | 'riza'
  | 'nuri'
  | 'kemal';

export interface CouncilVisualState {
  pickedIds: string[];
  remainingBudget: number;
  reservoirBefore: number;
  reservoirAfter: number;
}

interface CharacterRig {
  id: CouncilAnchorId;
  sprite?: THREE.Sprite;
  baseY: number;
  phase: number;
  active: boolean;
}

export class MayorCouncilScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private pickables: { solutionId: SolutionId; object: THREE.Object3D }[] = [];
  private anchors = new Map<CouncilAnchorId, THREE.Vector3>();
  private labels = new Map<CouncilAnchorId, HTMLElement>();
  private rigs: CharacterRig[] = [];

  // Tabletop miniature meshes that react to picked solutions
  private pipeMesh!: THREE.Mesh;
  private leakRing!: THREE.Mesh;
  private farmGroup!: THREE.Group;
  private farmLeaves: THREE.Mesh[] = [];
  private rainTanksGroup!: THREE.Group;
  private fountainJet!: THREE.Mesh;
  private homesGlowGroup!: THREE.Group;
  private reservoirWater!: THREE.Mesh;
  private holoRing!: THREE.Mesh;

  private state: CouncilVisualState = {
    pickedIds: [],
    remainingBudget: 1_000_000,
    reservoirBefore: 40,
    reservoirAfter: 40,
  };

  private raf = 0;
  private clock = new THREE.Clock();
  private downAt: { x: number; y: number } | null = null;
  private hoverId: SolutionId | null = null;
  private resize: ResizeObserver;
  private host: HTMLElement;
  private onToggleSolution: (id: SolutionId) => void;

  constructor(host: HTMLElement, onToggleSolution: (id: SolutionId) => void) {
    this.host = host;
    this.onToggleSolution = onToggleSolution;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.touchAction = 'none';

    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 150);
    this.camera.position.set(0, 6.8, 11.2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1.3, -0.6);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 7.2;
    this.controls.maxDistance = 17.5;
    this.controls.maxPolarAngle = 1.36;
    this.controls.minPolarAngle = 0.38;
    this.controls.minAzimuthAngle = -0.95;
    this.controls.maxAzimuthAngle = 0.95;

    this.buildAtmosphere();
    this.buildLights();
    this.buildChamberArchitecture();
    this.buildCouncilTableAndPodium();
    this.buildTabletopTownMiniature();
    this.buildCouncilMembers();

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
    this.state = next;
    this.applyState();
  }

  attachLabel(id: CouncilAnchorId, el: HTMLElement | null): void {
    if (el) this.labels.set(id, el);
    else this.labels.delete(id);
  }

  resetView(): void {
    this.camera.position.set(0, 6.8, 11.2);
    this.controls.target.set(0, 1.3, -0.6);
    this.controls.update();
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

  private mat(color: number, roughness = 0.65, metalness = 0.08): THREE.MeshStandardMaterial {
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
    this.scene.background = new THREE.Color(0x16241f);
    this.scene.fog = new THREE.FogExp2(0x16241f, 0.022);
  }

  private buildLights(): void {
    this.scene.add(new THREE.HemisphereLight(0xfff4dc, 0x243830, 0.85));

    const key = new THREE.DirectionalLight(0xfff1d0, 1.45);
    key.position.set(5, 11, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const sc = key.shadow.camera;
    sc.near = 1;
    sc.far = 30;
    sc.left = -9;
    sc.right = 9;
    sc.top = 9;
    sc.bottom = -9;
    key.shadow.bias = -0.0005;
    this.scene.add(key);

    // Warm spotlight over the council table miniature
    const tableSpot = new THREE.PointLight(0x7be8d0, 1.1, 8);
    tableSpot.position.set(0, 2.8, 0.2);
    this.scene.add(tableSpot);

    // Warm gold light over Mayor Adil's podium
    const podiumLight = new THREE.PointLight(0xffd782, 1.0, 7);
    podiumLight.position.set(0, 3.8, -3.2);
    this.scene.add(podiumLight);
  }

  private buildChamberArchitecture(): void {
    // Marble floor platform
    const floor = this.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(8.2, 8.5, 0.36, 48),
        this.mat(0xdcd3c2, 0.45, 0.1),
      ),
    );
    floor.position.y = -0.18;

    // Gold inlay ring on marble floor
    const goldRing = new THREE.Mesh(
      new THREE.RingGeometry(4.6, 4.78, 48),
      this.mat(0xd9ae52, 0.3, 0.6),
    );
    goldRing.rotation.x = -Math.PI / 2;
    goldRing.position.y = 0.01;
    this.scene.add(goldRing);

    // Ceremonial red carpet leading to the podium
    const carpet = this.add(
      new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.03, 7.6), this.mat(0x8e2424, 0.85, 0.02)),
    );
    carpet.position.set(0, 0.015, 0.4);

    // Raised wooden dais at the back for Mayor Adil
    const dais = this.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(3.4, 3.6, 0.32, 32, 1, false, -Math.PI * 0.5, Math.PI),
        this.mat(0x5b3b24, 0.55, 0.08),
      ),
    );
    dais.rotation.y = Math.PI;
    dais.position.set(0, 0.16, -2.4);

    // Curved wood-paneled back wall
    const wall = this.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(7.6, 7.6, 4.8, 36, 1, true, Math.PI * 0.62, Math.PI * 0.76),
        new THREE.MeshStandardMaterial({
          color: 0x3b281a,
          roughness: 0.6,
          metalness: 0.08,
          side: THREE.DoubleSide,
        }),
      ),
    );
    wall.position.y = 2.4;

    // Classical columns along the back arc
    const colMat = this.mat(0xebe3d2, 0.45, 0.08);
    const goldMat = this.mat(0xe0b85c, 0.3, 0.55);
    for (const angle of [-0.92, -0.45, 0.45, 0.92]) {
      const r = 7.1;
      const x = Math.sin(angle) * r;
      const z = -Math.cos(angle) * r;
      const col = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 4.5, 16), colMat));
      col.position.set(x, 2.25, z);
      const base = this.add(new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.24, 0.75), goldMat));
      base.position.set(x, 0.12, z);
    }

    // Official Municipality Seal Emblem on the center back wall
    const sealDisc = this.add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 32), goldMat),
    );
    sealDisc.rotation.x = Math.PI / 2;
    sealDisc.position.set(0, 3.45, -7.2);

    // Twin ceremonial flags flanking the podium
    const flagColors = [0xc82828, 0x0d7a5f];
    [-1.9, 1.9].forEach((x, idx) => {
      const pole = this.add(
        new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.5, 10), goldMat),
      );
      pole.position.set(x, 1.9, -4.6);
      const banner = this.add(
        new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.35, 0.04), this.mat(flagColors[idx], 0.6)),
      );
      banner.position.set(x, 2.55, -4.55);
    });
  }

  private buildCouncilTableAndPodium(): void {
    const mahogany = this.mat(0x56341e, 0.45, 0.12);
    const darkWood = this.mat(0x3a2212, 0.55, 0.1);
    const goldMat = this.mat(0xe2b857, 0.3, 0.55);
    const leather = this.mat(0x1f4e3d, 0.6, 0.05);

    // Mayor's Head Podium Desk
    const podium = new THREE.Group();
    podium.position.set(0, 0.32, -3.35);
    this.scene.add(podium);

    const pBody = this.add(new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.05, 0.95), mahogany), podium);
    pBody.position.y = 0.52;
    const pTop = this.add(new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.1, 1.1), darkWood), podium);
    pTop.position.y = 1.08;
    const crest = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 20), goldMat), podium);
    crest.rotation.x = Math.PI / 2;
    crest.position.set(0, 0.58, 0.49);

    // Mayor's High-Back Chair
    const mChair = this.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.2), leather));
    mChair.position.set(0, 1.12, -4.25);

    // Central Circular Strategy Table
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0, 0.3);
    this.scene.add(tableGroup);

    const pedestal = this.add(
      new THREE.Mesh(new THREE.CylinderGeometry(1.65, 2.0, 0.82, 32), darkWood),
      tableGroup,
    );
    pedestal.position.y = 0.41;

    const tableRim = this.add(
      new THREE.Mesh(new THREE.CylinderGeometry(2.85, 2.75, 0.14, 36), mahogany),
      tableGroup,
    );
    tableRim.position.y = 0.88;

    // Glowing holographic ring on top of the strategy table
    this.holoRing = new THREE.Mesh(
      new THREE.RingGeometry(2.15, 2.35, 48),
      new THREE.MeshBasicMaterial({
        color: 0x4de0c2,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
      }),
    );
    this.holoRing.rotation.x = -Math.PI / 2;
    this.holoRing.position.set(0, 0.96, 0.3);
    this.scene.add(this.holoRing);
  }

  private buildTabletopTownMiniature(): void {
    const base = new THREE.Group();
    base.position.set(0, 0.96, 0.3);
    this.scene.add(base);

    // Miniature green terrain disc
    const island = this.add(
      new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.15, 0.08, 36), this.mat(0x69a84f, 0.75)),
      base,
    );
    island.position.y = 0.04;

    // 1. Reservoir / Dam at the North of the miniature (linked to 'repair-pipes' & 'saving-campaign')
    const damWall = this.add(
      new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.28, 0.18), this.mat(0x8c9aa4, 0.5)),
      base,
    );
    damWall.position.set(0, 0.18, -1.25);

    this.reservoirWater = this.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(1.22, 0.2, 0.55),
        new THREE.MeshStandardMaterial({
          color: 0x3598db,
          roughness: 0.2,
          metalness: 0.1,
        }),
      ),
      base,
    );
    this.reservoirWater.position.set(0, 0.14, -1.55);

    // 2. Main Underground Pipe & Leak Indicator ('repair-pipes')
    const pipeGroup = new THREE.Group();
    base.add(pipeGroup);
    this.pipeMesh = this.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 1.8, 12),
        new THREE.MeshStandardMaterial({ color: 0xd9534f, roughness: 0.35, metalness: 0.3 }),
      ),
      pipeGroup,
    );
    this.pipeMesh.rotation.z = Math.PI / 2;
    this.pipeMesh.position.set(0.35, 0.14, -0.35);

    this.leakRing = new THREE.Mesh(
      new THREE.RingGeometry(0.14, 0.26, 20),
      new THREE.MeshBasicMaterial({ color: 0xff4d4d, side: THREE.DoubleSide }),
    );
    this.leakRing.rotation.x = -Math.PI / 2;
    this.leakRing.position.set(0.45, 0.1, -0.35);
    pipeGroup.add(this.leakRing);
    this.registerPickable('repair-pipes', pipeGroup);

    // 3. Agriculture / Drip Irrigation Rows on West ('drip-irrigation')
    this.farmGroup = new THREE.Group();
    this.farmGroup.position.set(-1.1, 0.08, 0.15);
    base.add(this.farmGroup);
    for (let r = -1; r <= 1; r++) {
      const bed = this.add(
        new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.18), this.mat(0x6d4c30)),
        this.farmGroup,
      );
      bed.position.set(0, 0.03, r * 0.28);
      for (let p = -1; p <= 1; p++) {
        const leaf = this.add(
          new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xb8a24c, roughness: 0.6 }),
          ),
          this.farmGroup,
        );
        leaf.position.set(p * 0.25, 0.11, r * 0.28);
        this.farmLeaves.push(leaf);
      }
    }
    this.registerPickable('drip-irrigation', this.farmGroup);

    // 4. Center Park Fountain ('fountains-off')
    const parkGroup = new THREE.Group();
    parkGroup.position.set(0, 0.08, 0.25);
    base.add(parkGroup);
    const basin = this.add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.12, 18), this.mat(0xcfd6dc)),
      parkGroup,
    );
    basin.position.y = 0.06;
    this.fountainJet = this.add(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.14, 0.42, 12),
        new THREE.MeshStandardMaterial({
          color: 0x5bc0de,
          transparent: true,
          opacity: 0.85,
        }),
      ),
      parkGroup,
    );
    this.fountainJet.position.y = 0.3;
    this.registerPickable('fountains-off', parkGroup);

    // 5. Rainwater Harvest Tanks ('rain-harvest')
    this.rainTanksGroup = new THREE.Group();
    this.rainTanksGroup.position.set(0.55, 0.08, 0.85);
    base.add(this.rainTanksGroup);
    for (const dx of [-0.18, 0.18]) {
      const tank = this.add(
        new THREE.Mesh(
          new THREE.CylinderGeometry(0.13, 0.13, 0.32, 14),
          new THREE.MeshStandardMaterial({ color: 0x2b8cbe, roughness: 0.3 }),
        ),
        this.rainTanksGroup,
      );
      tank.position.set(dx, 0.16, 0);
    }
    this.registerPickable('rain-harvest', this.rainTanksGroup);

    // 6. Residential Houses ('saving-campaign')
    this.homesGlowGroup = new THREE.Group();
    this.homesGlowGroup.position.set(1.15, 0.08, -0.1);
    base.add(this.homesGlowGroup);
    for (const [dx, dz] of [
      [-0.2, -0.22],
      [0.2, -0.22],
      [0, 0.22],
    ]) {
      const walls = this.add(
        new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.28), this.mat(0xf4ead5)),
        this.homesGlowGroup,
      );
      walls.position.set(dx, 0.12, dz);
      const roof = this.add(
        new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.18, 4), this.mat(0xb84a39)),
        this.homesGlowGroup,
      );
      roof.rotation.y = Math.PI / 4;
      roof.position.set(dx, 0.33, dz);
    }
    this.registerPickable('saving-campaign', this.homesGlowGroup);
  }

  private buildCouncilMembers(): void {
    const baseUrl = import.meta.env.BASE_URL;
    const loader = new THREE.TextureLoader();

    const members: {
      id: CouncilAnchorId;
      file: string;
      pos: [number, number, number];
      height: number;
      solutionId?: SolutionId;
    }[] = [
      {
        id: 'mayor',
        file: `${baseUrl}assets/characters/mayor.png`,
        pos: [0, 0.35, -3.85],
        height: 2.35,
      },
      {
        id: 'aylin',
        file: `${baseUrl}assets/characters/muhendis-aylin.png`,
        pos: [-3.35, 0.02, -1.25],
        height: 2.15,
        solutionId: 'rain-harvest',
      },
      {
        id: 'nuri',
        file: `${baseUrl}assets/characters/nuri-amca.png`,
        pos: [-2.45, 0.02, 1.75],
        height: 2.15,
        solutionId: 'repair-pipes',
      },
      {
        id: 'kemal',
        file: `${baseUrl}assets/characters/isci-kemal.png`,
        pos: [2.45, 0.02, 1.75],
        height: 2.15,
        solutionId: 'fountains-off',
      },
      {
        id: 'riza',
        file: `${baseUrl}assets/characters/ciftci-riza.png`,
        pos: [3.35, 0.02, -1.25],
        height: 2.15,
        solutionId: 'drip-irrigation',
      },
    ];

    members.forEach((m, index) => {
      const [x, y, z] = m.pos;
      this.anchors.set(m.id, new THREE.Vector3(x, y + m.height + 0.25, z));

      const rig: CharacterRig = {
        id: m.id,
        baseY: y,
        phase: index * 1.1,
        active: m.id === 'mayor',
      };
      this.rigs.push(rig);

      // Floor shadow + council pedestal disc under each member
      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.58, 20),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(x, y + 0.02, z);
      this.scene.add(shadow);

      loader.load(m.file, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        // All character sheets are 1x4 strips [down, right, up, left]; crop to frame 0 (front pose)
        tex.repeat.set(0.25, 1);
        tex.offset.set(0, 0);
        const frameW = tex.image.width / 4;
        const frameH = tex.image.height;
        const aspect = frameW / frameH;

        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(m.height * aspect, m.height, 1);
        sprite.center.set(0.5, 0);
        sprite.position.set(x, y, z);
        this.scene.add(sprite);
        rig.sprite = sprite;

        if (m.solutionId) {
          this.registerPickable(m.solutionId, sprite);
        }
      });
    });

    // Also place Lina beside the podium welcoming the player
    loader.load(`${baseUrl}assets/characters/lina.png`, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.repeat.set(0.25, 1);
      tex.offset.set(0, 0);
      const aspect = tex.image.width / 4 / tex.image.height;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
      const h = 1.85;
      sprite.scale.set(h * aspect, h, 1);
      sprite.center.set(0.5, 0);
      sprite.position.set(-1.75, 0.32, -3.15);
      this.scene.add(sprite);
    });
  }

  private registerPickable(solutionId: SolutionId, object: THREE.Object3D): void {
    this.pickables.push({ solutionId, object });
  }

  // ---------------------------------------------------------------------------
  // State -> 3D Visuals
  // ---------------------------------------------------------------------------

  private applyState(): void {
    const picked = new Set(this.state.pickedIds);

    // 1. Pipe repair
    const pipeRepaired = picked.has('repair-pipes');
    (this.pipeMesh.material as THREE.MeshStandardMaterial).color.setHex(
      pipeRepaired ? 0x2ecc71 : 0xd9534f,
    );
    this.leakRing.visible = !pipeRepaired;

    // 2. Farm drip irrigation
    const dripOn = picked.has('drip-irrigation');
    for (const leaf of this.farmLeaves) {
      (leaf.material as THREE.MeshStandardMaterial).color.setHex(dripOn ? 0x2ecc71 : 0xb8a24c);
      leaf.scale.setScalar(dripOn ? 1.22 : 0.92);
    }

    // 3. Fountains off
    const fountainsOff = picked.has('fountains-off');
    this.fountainJet.visible = !fountainsOff;

    // 4. Rain harvest tanks
    const rainOn = picked.has('rain-harvest');
    this.rainTanksGroup.scale.setScalar(rainOn ? 1.25 : 0.78);

    // 5. Saving campaign
    const savingOn = picked.has('saving-campaign');
    this.homesGlowGroup.scale.setScalar(savingOn ? 1.15 : 0.95);

    // Reservoir level height
    const pct = Math.max(15, Math.min(95, this.state.reservoirAfter));
    const scaleY = pct / 55;
    this.reservoirWater.scale.y = scaleY;

    // Highlight council members whose district is addressed
    for (const rig of this.rigs) {
      if (rig.id === 'mayor') rig.active = true;
      else if (rig.id === 'aylin') rig.active = pipeRepaired || rainOn;
      else if (rig.id === 'nuri') rig.active = pipeRepaired || savingOn;
      else if (rig.id === 'riza') rig.active = dripOn;
      else if (rig.id === 'kemal') rig.active = fountainsOff || rainOn;
    }
  }

  // ---------------------------------------------------------------------------
  // Pointer Interaction
  // ---------------------------------------------------------------------------

  private pick(e: PointerEvent): SolutionId | null {
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
      if (found) return found.solutionId;
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
    const id = this.pick(e);
    if (id) this.onToggleSolution(id);
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
  // Render Loop
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
    this.clock.getDelta();
    const time = this.clock.elapsedTime;
    this.controls.update();

    // Subtle breathing / nodding animation for council members
    for (const rig of this.rigs) {
      if (!rig.sprite) continue;
      const amp = rig.active ? 0.045 : 0.015;
      const speed = rig.active ? 3.2 : 1.5;
      rig.sprite.position.y = rig.baseY + Math.abs(Math.sin(time * speed + rig.phase)) * amp;
    }

    // Pulse holographic ring
    this.holoRing.rotation.z = time * 0.25;

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
