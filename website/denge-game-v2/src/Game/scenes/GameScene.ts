/**
 * The one and only active scene.
 *
 * Consolidated from the two previous prototypes (both archived under
 * `src/Game/legacy/`):
 *   - the Tiled scene contributed the player, movement, animation and camera
 *   - the unused prototype contributed the NPC, proximity hint, E interaction,
 *     foot-box collision and the EventBus round-trip
 *
 * The world itself is now built from individual PNGs described in
 * `src/Game/data/`. There is deliberately no tilemap/tileset API in here.
 *
 * Render order (low -> high):
 *   ground layers  ->  flat decals  ->  y-sorted world objects & actors  ->  UI text
 */

import Phaser from 'phaser';

import {
  IMAGE_ASSETS,
  PLAYER_ANIM_FRAMES,
  PlayerAnims,
  SPRITESHEET_ASSETS,
  TextureKeys,
  type PlayerAnimKey,
} from '../data/assets';
import { DECISION_FEEDBACK, NPCS, type NpcDefinition } from '../data/npcs';
import {
  districtAt,
  PLAYER_SPAWN,
  WORLD,
  type District,
} from '../data/districts';
import {
  COLLISION_ZONES,
  GROUND_LAYERS,
  WORLD_OBJECTS,
  type CollisionBox,
} from '../data/worldObjects';
import { EventBus } from '../events/EventBus';
import { GameEvents } from '../events/gameEvents';
import { LINA_INTRO_PAGES, LINA_REPORT_TEXT, type InvestigationId } from '../data/story';
import { loadSession, saveSession, type QuestStage } from '../data/session';
import { VISIBLE_WORLD_HEIGHT } from '../config';

type Facing = 'down' | 'up' | 'left' | 'right';

/**
 * Chapter 1 quest flow:
 *   lina-intro -> meet-mayor -> investigate -> report -> meeting -> done
 * Phaser owns progression (it sees proximity + E presses); React owns the
 * modal cards, the notebook and the objective pill.
 */

const DISTRICT_CARDS: readonly InvestigationId[] = ['baraj', 'tarim', 'konut', 'park'];

const PLAYER_SPEED = 170;

/**
 * The smooth character art is drawn ~2x the old pixel frame; 0.53 brings the
 * player back to ~48px tall in world space, matching the previous feel.
 */
const PLAYER_SCALE = 0.53;

/** Above every world object, below nothing. */
const UI_DEPTH = 1_000_000;

/** Foot-box for the 41x91 player frame, in source-image pixels (scaled by PLAYER_SCALE). */
const PLAYER_BODY = { width: 26, height: 17, offsetX: 7, offsetY: 70 };

interface Npc {
  definition: NpcDefinition;
  sprite: Phaser.GameObjects.Sprite;
}

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private npcs: Npc[] = [];
  private hint!: Phaser.GameObjects.Text;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'E' | 'DEBUG', Phaser.Input.Keyboard.Key>;

  private facing: Facing = 'down';
  private dialogueOpen = false;
  private activeNpc: Npc | null = null;
  private currentDistrict: District | null = null;

  // ---- Chapter 1 quest -----------------------------------------------------
  private quest: QuestStage = 'lina-intro';
  private completedCards = new Set<InvestigationId>();
  /** "!" markers floating above quest NPCs, keyed by npc id. */
  private questMarkers = new Map<string, Phaser.GameObjects.Text>();
  /** Edge-of-screen arrow pointing at the current objective. */
  private guideArrow: Phaser.GameObjects.Triangle | null = null;
  private lina: Npc | null = null;
  /** Ring buffer of recent player positions that Lina trails. */
  private followTrail: { x: number; y: number }[] = [];

  /**
   * The strips have one pose per direction - no walk cycle - so a gentle
   * side-to-side waddle sells the movement instead.
   */
  private walkTween: Phaser.Tweens.Tween | null = null;
  private waddling = false;

  /** Our own collision-box overlays, shown by the debug toggle. */
  private debugShapes: Phaser.GameObjects.Rectangle[] = [];
  private debugVisible = false;

  constructor() {
    super('GameScene');
  }

  // =========================================================================
  // PRELOAD
  // =========================================================================

  preload(): void {
    this.load.setBaseURL(import.meta.env.BASE_URL);
    for (const asset of IMAGE_ASSETS) {
      this.load.image(asset.key, asset.path);
    }

    for (const sheet of SPRITESHEET_ASSETS) {
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    }
  }

  // =========================================================================
  // CREATE
  // =========================================================================

  create(): void {
    this.applyTextureFilters();

    // Mock resume: a saved session restores the quest stage and the completed
    // investigation cards. The intro only auto-plays for a brand new session.
    const saved = loadSession();
    if (saved && saved.quest !== 'lina-intro') {
      this.quest = saved.quest;
      for (const cardId of saved.completedCards) this.completedCards.add(cardId);
    }

    this.obstacles = this.physics.add.staticGroup();

    this.createGround();
    this.createWorldObjects();
    this.createCollisionZones();
    this.createPlayerAnimations();
    this.createPlayer();
    this.createNpcs();
    this.createHint();
    this.createInput();
    this.createCamera();
    this.createDebugOverlay();
    this.bindReactEvents();
    this.createQuestMarkers();
    this.createGuideArrow();

    // Report the starting district so the HUD is correct before the first move.
    this.updateDistrict(true);

    // Let the camera settle, then Lina delivers the opening briefing - unless
    // this is a resumed session that is already past the intro.
    if (this.quest === 'lina-intro') {
      this.setObjective('Lina’yı dinle');
      this.time.delayedCall(700, () => this.startLinaIntro());
    } else {
      this.refreshQuestMarkers();
      this.emitObjective();
    }
  }

  /**
   * `pixelArt: true` makes every texture NEAREST by default. The illustrated
   * assets are downscaled ~2x in-world, so they opt into LINEAR filtering to
   * avoid crawlies - the pixel tiles keep their crisp NEAREST sampling.
   */
  private applyTextureFilters(): void {
    for (const asset of [...IMAGE_ASSETS, ...SPRITESHEET_ASSETS]) {
      if (asset.smooth) {
        this.textures.get(asset.key).setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    }
  }

  /** Flat floor layers: grass base, district tints, water, roads. */
  private createGround(): void {
    for (const layer of GROUND_LAYERS) {
      const scaleY = layer.scaleY ?? 1;
      this.add
        .tileSprite(
          layer.x + layer.width / 2,
          layer.y + layer.height / 2,
          layer.width,
          layer.height / scaleY,
          layer.textureKey,
        )
        .setScale(1, scaleY)
        .setDepth(layer.depth);
    }
  }

  /**
   * Instantiates every declarative world object.
   *
   * Sorted objects use origin (0.5, 1) so `y` is the base line and `depth = y`
   * makes actors correctly pass in front of / behind them.
   */
  private createWorldObjects(): void {
    for (const object of WORLD_OBJECTS) {
      const sprite = this.add
        .image(object.x, object.y, object.textureKey)
        .setOrigin(0.5, 1)
        .setScale(object.scale ?? 1)
        .setFlipX(object.flipX ?? false);

      if (object.depthMode === 'ground') {
        sprite.setDepth(object.depth ?? 0);
      } else {
        sprite.setDepth(object.y);
      }

      if (object.collision) {
        this.addObstacle(object.collision, object.x, object.y, object.id);
      }
    }
  }

  /** Collision rectangles with no sprite of their own, e.g. the reservoir. */
  private createCollisionZones(): void {
    for (const zone of COLLISION_ZONES) {
      this.addObstacleRect(
        zone.x + zone.width / 2,
        zone.y + zone.height / 2,
        zone.width,
        zone.height,
        zone.id,
      );
    }
  }

  /**
   * Turns a base-line-relative footprint into a static Arcade body.
   * Arcade Physics is AABB only - no polygons - which is why every obstacle is
   * a rectangle placed at the object's feet.
   */
  private addObstacle(box: CollisionBox, baseX: number, baseY: number, id: string): void {
    this.addObstacleRect(
      baseX + (box.offsetX ?? 0),
      baseY + (box.offsetY ?? -box.height / 2),
      box.width,
      box.height,
      id,
    );
  }

  private addObstacleRect(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    id: string,
  ): void {
    const rect = this.add
      .rectangle(centerX, centerY, width, height, 0xff2f6d, 0.35)
      .setOrigin(0.5, 0.5)
      .setDepth(UI_DEPTH - 1)
      .setVisible(this.debugVisible);

    rect.setName(`collider:${id}`);

    this.physics.add.existing(rect, true);
    this.obstacles.add(rect);
    this.debugShapes.push(rect);
  }

  private createPlayerAnimations(): void {
    for (const [key, frames] of Object.entries(PLAYER_ANIM_FRAMES)) {
      // Guard against duplicate creation if the scene is ever restarted.
      if (this.anims.exists(key)) continue;

      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(TextureKeys.PLAYER, {
          start: frames.start,
          end: frames.end,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  private createPlayer(): void {
    // Inset the physics bounds so the sprite's head/feet stay inside the world.
    this.physics.world.setBounds(16, 56, WORLD.width - 32, WORLD.height - 72);

    this.player = this.physics.add
      .sprite(PLAYER_SPAWN.x, PLAYER_SPAWN.y, TextureKeys.PLAYER)
      .setOrigin(0.5, 1)
      .setScale(PLAYER_SCALE);

    this.player.setFrame(PLAYER_ANIM_FRAMES[PlayerAnims.WALK_DOWN].idle);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(this.player.y);

    // Foot-box rather than the full frame, so the player collides with its
    // feet. Offsets are in source-image pixels from the frame's top-left,
    // which is independent of the origin and scale above.
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER_BODY.width, PLAYER_BODY.height);
    body.setOffset(PLAYER_BODY.offsetX, PLAYER_BODY.offsetY);

    this.walkTween = this.tweens.add({
      targets: this.player,
      angle: { from: -3, to: 3 },
      duration: 150,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      paused: true,
    });

    this.physics.add.collider(this.player, this.obstacles);
  }

  private createNpcs(): void {
    for (const definition of NPCS) {
      const sprite = this.add
        .sprite(definition.x, definition.y, definition.textureKey, definition.frame)
        .setOrigin(0.5, 1)
        .setScale(definition.scale)
        .setDepth(definition.y);

      // A follower needs no static obstacle - she would leave an invisible
      // wall at her spawn point once she starts trailing the player.
      if (!definition.followsPlayer) {
        this.addObstacle(
          { width: definition.collision.width * definition.scale, height: definition.collision.height },
          definition.x,
          definition.y,
          definition.id,
        );
      }

      const npc = { definition, sprite };
      this.npcs.push(npc);
      if (definition.id === 'lina') this.lina = npc;
    }
  }

  private createHint(): void {
    this.hint = this.add
      .text(0, 0, '', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000cc',
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setDepth(UI_DEPTH)
      .setVisible(false);
  }

  private createInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      console.warn('[GameScene] Keyboard input unavailable; the player cannot be moved.');
      return;
    }

    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      DEBUG: Phaser.Input.Keyboard.KeyCodes.BACKTICK,
    }) as typeof this.keys;
  }

  private createCamera(): void {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD.width, WORLD.height);
    camera.startFollow(this.player, true, 0.1, 0.1);
    const fitZoom = () => camera.setZoom(this.scale.height / VISIBLE_WORLD_HEIGHT);
    fitZoom();
    this.scale.on('resize', fitZoom);
  }

  /**
   * Collision visualisation, toggled with the backtick (`) key.
   * Shows both the Arcade body outlines and our own footprint rectangles.
   */
  private createDebugOverlay(): void {
    const graphic = this.physics.world.createDebugGraphic();
    graphic.setDepth(UI_DEPTH - 2);

    this.physics.world.drawDebug = this.debugVisible;
    graphic.setVisible(this.debugVisible);
  }

  private toggleDebug(): void {
    this.debugVisible = !this.debugVisible;

    this.physics.world.drawDebug = this.debugVisible;
    this.physics.world.debugGraphic?.setVisible(this.debugVisible);
    if (!this.debugVisible) this.physics.world.debugGraphic?.clear();

    for (const shape of this.debugShapes) shape.setVisible(this.debugVisible);
  }

  // =========================================================================
  // CHAPTER 1 QUEST
  // =========================================================================

  private createQuestMarkers(): void {
    for (const npc of this.npcs) {
      if (!npc.definition.investigationId && npc.definition.id !== 'lina') continue;
      const marker = this.add
        .text(npc.definition.x, npc.definition.y - npc.sprite.displayHeight - 30, '!', {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '30px',
          fontStyle: 'bold',
          color: '#ffd34d',
          stroke: '#5a3c00',
          strokeThickness: 5,
        })
        .setOrigin(0.5, 0.5)
        .setDepth(UI_DEPTH)
        .setVisible(false);
      this.tweens.add({
        targets: marker,
        y: marker.y - 8,
        duration: 550,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.questMarkers.set(npc.definition.id, marker);
    }
    this.refreshQuestMarkers();
  }

  private refreshQuestMarkers(): void {
    for (const [id, marker] of this.questMarkers) {
      const npc = this.npcs.find((n) => n.definition.id === id);
      if (!npc) continue;
      marker.setVisible(this.isQuestTarget(npc));
      // Follower Lina's marker rides her actual position, not the spawn point.
      if (npc.definition.followsPlayer) {
        marker.setX(npc.sprite.x);
      }
    }
  }

  private isQuestTarget(npc: Npc): boolean {
    const id = npc.definition.investigationId;
    switch (this.quest) {
      case 'meet-mayor':
        return id === 'belediye';
      case 'investigate':
        return !!id && id !== 'belediye' && !this.completedCards.has(id);
      case 'report':
        return npc.definition.id === 'lina';
      case 'meeting':
        return id === 'belediye';
      default:
        return false;
    }
  }

  private createGuideArrow(): void {
    this.guideArrow = this.add
      .triangle(0, 0, 0, 16, 12, -10, 24, 16, 0xffd34d)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(3, 0x5a3c00)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH)
      .setVisible(false);
  }

  /** Current world position the guide arrow should point at, if any. */
  private questTarget(): { x: number; y: number } | null {
    if (this.quest === 'lina-intro' || this.quest === 'done' || this.dialogueOpen) return null;

    if (this.quest === 'report') {
      return this.lina ? { x: this.lina.sprite.x, y: this.lina.sprite.y } : null;
    }

    const candidates = this.npcs.filter((n) => this.isQuestTarget(n));
    if (candidates.length === 0) return null;

    // Nearest outstanding target wins - free exploration order stays free.
    let best = candidates[0];
    let bestDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, best.definition.x, best.definition.y);
    for (const npc of candidates.slice(1)) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.definition.x, npc.definition.y);
      if (d < bestDistance) {
        best = npc;
        bestDistance = d;
      }
    }
    return best === this.lina
      ? { x: this.lina.sprite.x, y: this.lina.sprite.y }
      : { x: best.definition.x, y: best.definition.y };
  }

  private updateGuideArrow(): void {
    if (!this.guideArrow) return;
    const target = this.questTarget();
    if (!target) {
      this.guideArrow.setVisible(false);
      return;
    }

    const camera = this.cameras.main;
    const margin = 70;
    const viewW = camera.width;
    const viewH = camera.height;
    // World -> screen.
    const sx = (target.x - camera.scrollX) * camera.zoom;
    const sy = (target.y - camera.scrollY) * camera.zoom;

    // On screen already: the "!" marker is enough.
    if (sx > margin && sx < viewW - margin && sy > margin && sy < viewH - margin) {
      this.guideArrow.setVisible(false);
      return;
    }

    const cx = viewW / 2;
    const cy = viewH / 2;
    const angle = Math.atan2(sy - cy, sx - cx);
    // Clamp the arrow to a rectangle margin around the screen centre.
    const tx = Math.cos(angle);
    const ty = Math.sin(angle);
    const scale = Math.min(
      Math.abs((viewW / 2 - margin) / (tx || 1e-6)),
      Math.abs((viewH / 2 - margin) / (ty || 1e-6)),
    );
    this.guideArrow
      .setPosition(cx + tx * scale, cy + ty * scale)
      .setRotation(angle + Math.PI / 2)
      .setVisible(true);
  }

  private setObjective(text: string | null): void {
    EventBus.emit(GameEvents.OBJECTIVE_CHANGED, { text, stage: this.quest });
    this.persistProgress();
  }

  /** Writes quest position into the mock session store (survives reloads). */
  private persistProgress(): void {
    const saved = loadSession();
    if (!saved) return;
    saveSession({ ...saved, quest: this.quest, completedCards: [...this.completedCards] });
  }

  private startLinaIntro(): void {
    if (this.quest !== 'lina-intro' || !this.lina) return;
    this.dialogueOpen = true;
    this.activeNpc = this.lina;
    EventBus.emit(GameEvents.OPEN_DIALOGUE, {
      npcId: 'lina',
      name: 'Lina',
      text: LINA_INTRO_PAGES[0],
      pages: [...LINA_INTRO_PAGES.slice(1)],
    });
  }

  private openInvestigation(npc: Npc, cardId: InvestigationId): void {
    this.dialogueOpen = true;
    this.activeNpc = npc;
    this.player.setVelocity(0, 0);
    this.player.anims.stop();
    this.stopWaddle();
    this.setIdleFrame();
    this.hint.setVisible(false);
    EventBus.emit(GameEvents.OPEN_INVESTIGATION, { cardId });
  }

  private handleInvestigationCompleted(cardId: string): void {
    const anchor = this.activeNpc?.sprite ?? this.player;
    this.dialogueOpen = false;
    this.activeNpc = null;
    const id = cardId as InvestigationId;
    this.completedCards.add(id);

    this.showToast('Deftere kaydedildi! 📒', anchor.x, anchor.y - anchor.displayHeight - 10);

    if (id === 'belediye' && this.quest === 'meet-mayor') {
      this.quest = 'investigate';
    } else if (this.quest === 'investigate' && DISTRICT_CARDS.every((c) => this.completedCards.has(c))) {
      this.quest = 'report';
    }
    this.refreshQuestMarkers();
    this.emitObjective();
  }

  private emitObjective(): void {
    switch (this.quest) {
      case 'lina-intro':
        this.setObjective('Lina’yı dinle');
        break;
      case 'meet-mayor':
        this.setObjective('Belediye binasına git ve Başkan ile konuş');
        break;
      case 'investigate': {
        const done = DISTRICT_CARDS.filter((c) => this.completedCards.has(c)).length;
        this.setObjective(`Bölgeleri incele ve deftere kaydet (${done}/${DISTRICT_CARDS.length})`);
        break;
      }
      case 'report':
        this.setObjective('Lina ile konuş');
        break;
      case 'meeting':
        this.setObjective('Belediye binasına dön ve çözüm planını sun');
        break;
      case 'done':
        this.setObjective(null);
        break;
    }
  }

  /** Lina trails the player once the briefing is over - visual only, no body. */
  private updateFollower(delta: number): void {
    if (!this.lina || this.quest === 'lina-intro') return;
    if (this.dialogueOpen) return;

    const lina = this.lina.sprite;
    this.followTrail.push({ x: this.player.x, y: this.player.y });
    if (this.followTrail.length > 60) this.followTrail.shift();

    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, lina.x, lina.y);
    // Never lag absurdly far behind (e.g. after a long walk or a tight corner).
    if (distance > 420) {
      lina.setPosition(this.player.x - 30, this.player.y + 10);
      this.followTrail.length = 0;
      return;
    }

    const lag = this.followTrail[0];
    const gap = Phaser.Math.Distance.Between(lina.x, lina.y, lag.x, lag.y);
    if (gap < 26) {
      lina.setDepth(lina.y);
      return;
    }
    const speed = Math.min(PLAYER_SPEED * 1.05, gap * 6);
    const step = (speed * delta) / 1000;
    lina.x += ((lag.x - lina.x) / gap) * step;
    lina.y += ((lag.y - lina.y) / gap) * step;
    lina.setDepth(lina.y);

    const dx = lag.x - lina.x;
    const dy = lag.y - lina.y;
    const frame = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 0 : 2;
    lina.setFrame(frame);
  }

  // =========================================================================
  // REACT <-> PHASER
  // =========================================================================

  private bindReactEvents(): void {
    EventBus.on(GameEvents.DIALOGUE_CLOSED, this.handleDialogueClosed, this);
    EventBus.on(GameEvents.DIALOGUE_CHOICE, this.handleDialogueChoice, this);
    EventBus.on(GameEvents.INVESTIGATION_COMPLETED, this.onInvestigationCompleted, this);
    EventBus.on(GameEvents.EVIDENCE_SUBMITTED, this.handleEvidenceSubmitted, this);
    EventBus.on(GameEvents.PLAN_SUBMITTED, this.handlePlanSubmitted, this);

    // Scenes outlive neither the game nor React, so unbind on shutdown to avoid
    // stacking duplicate handlers if the scene is ever restarted.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(GameEvents.DIALOGUE_CLOSED, this.handleDialogueClosed, this);
      EventBus.off(GameEvents.DIALOGUE_CHOICE, this.handleDialogueChoice, this);
      EventBus.off(GameEvents.INVESTIGATION_COMPLETED, this.onInvestigationCompleted, this);
      EventBus.off(GameEvents.EVIDENCE_SUBMITTED, this.handleEvidenceSubmitted, this);
      EventBus.off(GameEvents.PLAN_SUBMITTED, this.handlePlanSubmitted, this);
    });
  }

  private onInvestigationCompleted(payload: { cardId: string }): void {
    this.handleInvestigationCompleted(payload.cardId);
  }

  private handleDialogueClosed(): void {
    const wasIntro = this.quest === 'lina-intro' && this.activeNpc?.definition.id === 'lina';
    const wasReport = this.quest === 'report' && this.activeNpc?.definition.id === 'lina';
    this.dialogueOpen = false;
    this.activeNpc = null;

    if (wasIntro) {
      this.quest = 'meet-mayor';
      this.refreshQuestMarkers();
      this.emitObjective();
    } else if (wasReport) {
      // React now opens the notebook in evidence-marking mode; the quest only
      // advances to the meeting once the player submits the marked causes.
      EventBus.emit(GameEvents.OPEN_EVIDENCE);
    }
  }

  private handleEvidenceSubmitted(): void {
    if (this.quest !== 'report') return;
    this.quest = 'meeting';
    this.refreshQuestMarkers();
    this.emitObjective();
  }

  private handlePlanSubmitted(): void {
    if (this.quest !== 'meeting') return;
    this.quest = 'done';
    this.dialogueOpen = false;
    this.activeNpc = null;
    this.refreshQuestMarkers();
    this.emitObjective();
    this.showToast('Çözüm planın belediyeye teslim edildi! 🎉', this.player.x, this.player.y - 90);
  }

  private handleDialogueChoice(choiceId: string): void {
    const message = DECISION_FEEDBACK[choiceId] ?? 'Bir karar verdin.';

    // Show the acknowledgement over whoever the player was talking to.
    const anchor = this.activeNpc?.sprite ?? this.player;
    this.showToast(message, anchor.x, anchor.y - anchor.displayHeight - 10);

    this.dialogueOpen = false;
    this.activeNpc = null;
  }

  private openDialogue(npc: Npc): void {
    // Quest NPCs open their investigation card once the quest reaches them.
    const cardId = npc.definition.investigationId;
    if (cardId === 'belediye' && this.quest === 'meet-mayor') {
      this.openInvestigation(npc, cardId);
      return;
    }
    if (
      cardId &&
      cardId !== 'belediye' &&
      this.quest === 'investigate' &&
      !this.completedCards.has(cardId)
    ) {
      this.openInvestigation(npc, cardId);
      return;
    }

    // In the meeting stage the mayor opens the solution package panel.
    if (cardId === 'belediye' && this.quest === 'meeting') {
      this.dialogueOpen = true;
      this.activeNpc = npc;
      this.player.setVelocity(0, 0);
      this.player.anims.stop();
      this.stopWaddle();
      this.setIdleFrame();
      this.hint.setVisible(false);
      EventBus.emit(GameEvents.OPEN_SOLUTION);
      return;
    }

    // In the report stage Lina closes the chapter instead of small talk.
    if (npc.definition.id === 'lina' && this.quest === 'report') {
      this.dialogueOpen = true;
      this.activeNpc = npc;
      this.player.setVelocity(0, 0);
      this.player.anims.stop();
      this.stopWaddle();
      this.setIdleFrame();
      this.hint.setVisible(false);
      EventBus.emit(GameEvents.OPEN_DIALOGUE, {
        npcId: 'lina',
        name: 'Lina',
        text: LINA_REPORT_TEXT,
      });
      return;
    }

    this.dialogueOpen = true;
    this.activeNpc = npc;

    this.player.setVelocity(0, 0);
    this.player.anims.stop();
    this.stopWaddle();
    this.setIdleFrame();
    this.hint.setVisible(false);

    EventBus.emit(GameEvents.OPEN_DIALOGUE, {
      npcId: npc.definition.id,
      name: npc.definition.name,
      text: npc.definition.dialogue.text,
      choices: npc.definition.dialogue.choices,
    });
  }

  private showToast(message: string, x: number, y: number): void {
    const toast = this.add
      .text(x, y, message, {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#202020e6',
        padding: { x: 8, y: 6 },
        align: 'center',
        wordWrap: { width: 260 },
      })
      .setOrigin(0.5, 1)
      .setDepth(UI_DEPTH);

    this.tweens.add({
      targets: toast,
      y: toast.y - 28,
      alpha: 0,
      duration: 2200,
      ease: 'Power1',
      onComplete: () => toast.destroy(),
    });
  }

  private updateDistrict(force = false): void {
    const district = districtAt(this.player.x, this.player.y);
    if (!district) return;
    if (!force && district.id === this.currentDistrict?.id) return;

    this.currentDistrict = district;
    EventBus.emit(GameEvents.DISTRICT_CHANGED, { id: district.id, label: district.label });
  }

  // =========================================================================
  // UPDATE
  // =========================================================================

  update(_time: number, delta: number): void {
    if (!this.player || !this.keys) return;

    if (Phaser.Input.Keyboard.JustDown(this.keys.DEBUG)) this.toggleDebug();

    this.updateNearestNpc();
    this.updateGuideArrow();
    this.refreshQuestMarkers();

    if (this.dialogueOpen) {
      // React owns the interaction; freeze the player but keep rendering.
      this.player.setVelocity(0, 0);
      return;
    }

    this.updateMovement();
    this.updateFollower(delta);
    this.player.setDepth(this.player.y);
    this.updateDistrict();
  }

  /** Shows the hint for the closest NPC in range and handles the E press. */
  private updateNearestNpc(): void {
    let nearest: Npc | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const npc of this.npcs) {
      // Lina shadows the player, so her proximity hint would never leave the
      // screen - it only makes sense once she actually has something to say.
      if (npc.definition.followsPlayer && this.quest !== 'report') continue;

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npc.sprite.x,
        npc.sprite.y,
      );

      if (distance <= npc.definition.interactionRadius && distance < nearestDistance) {
        nearest = npc;
        nearestDistance = distance;
      }
    }

    if (nearest && !this.dialogueOpen) {
      this.hint
        .setText(nearest.definition.hint)
        .setPosition(nearest.sprite.x, nearest.sprite.y - nearest.sprite.displayHeight - 6)
        .setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.openDialogue(nearest);
    } else {
      this.hint.setVisible(false);
    }
  }

  private updateMovement(): void {
    // Opposing keys cancel out, and neither axis is checked "first", so there
    // is no input-order bias.
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;

    const inputX = (right ? 1 : 0) - (left ? 1 : 0);
    const inputY = (down ? 1 : 0) - (up ? 1 : 0);

    const velocity = new Phaser.Math.Vector2(inputX, inputY);
    if (velocity.length() > 0) velocity.normalize().scale(PLAYER_SPEED);
    this.player.setVelocity(velocity.x, velocity.y);

    if (inputX === 0 && inputY === 0) {
      this.player.anims.stop();
      this.stopWaddle();
      this.setIdleFrame();
      return;
    }

    // On a diagonal, keep the current facing if it is still being held. That
    // avoids one axis always winning.
    const candidates: Facing[] = [];
    if (inputX < 0) candidates.push('left');
    else if (inputX > 0) candidates.push('right');
    if (inputY < 0) candidates.push('up');
    else if (inputY > 0) candidates.push('down');

    this.facing = candidates.includes(this.facing) ? this.facing : candidates[0];
    this.player.anims.play(this.animFor(this.facing), true);

    if (!this.waddling) {
      this.waddling = true;
      this.walkTween?.resume();
    }
  }

  private stopWaddle(): void {
    if (!this.waddling) return;
    this.waddling = false;
    this.walkTween?.pause();
    this.player.setAngle(0);
  }

  private animFor(facing: Facing): PlayerAnimKey {
    switch (facing) {
      case 'up':
        return PlayerAnims.WALK_UP;
      case 'left':
        return PlayerAnims.WALK_LEFT;
      case 'right':
        return PlayerAnims.WALK_RIGHT;
      case 'down':
      default:
        return PlayerAnims.WALK_DOWN;
    }
  }

  private setIdleFrame(): void {
    this.player.setFrame(PLAYER_ANIM_FRAMES[this.animFor(this.facing)].idle);
  }
}
