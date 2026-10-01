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
  AUDIO_ASSETS,
  IMAGE_ASSETS,
  LINA_ANIM_FRAMES,
  LINA_IDLE_FRAMES,
  PLAYER_ANIM_FRAMES,
  PlayerAnims,
  SoundKeys,
  SPRITESHEET_ASSETS,
  TextureKeys,
  type PlayerAnimKey,
  type SoundKey,
  type TextureKey,
} from '../data/assets';
import { DECISION_FEEDBACK, NPCS, type NpcDefinition } from '../data/npcs';
import {
  districtAt,
  PARK_CENTER,
  PLAYER_SPAWN,
  WORLD,
  type District,
  type DistrictId,
} from '../data/districts';
import {
  COLLISION_ZONES,
  GROUND_LAYERS,
  GroundDepth,
  WORLD_OBJECTS,
  type CollisionBox,
} from '../data/worldObjects';
import { EventBus } from '../events/EventBus';
import {
  GameEvents,
  type DialoguePayload,
  type MinimapMarker,
} from '../events/gameEvents';
import {
  ANNOUNCE_NPC_IDS,
  DAY_STOPS,
  EXPECTATION_CHOICES,
  EXPECTATION_FEEDBACK,
  IMPLEMENTATION_PROPS,
  IMPLEMENT_END_PAGES,
  IMPLEMENT_MID_PAGES,
  LINA_CLOSING_CHOICES,
  LINA_CLOSING_FEEDBACK,
  LINA_CLOSING_PAGES,
  LINA_EXPECTATION_PAGES,
  LINA_INTRO_PAGES,
  LINA_REPORT_TEXT,
  LINA_RETRY_PAGES,
  MAYOR_DEBRIEF_PAGES,
  MAYOR_FOLLOWUP_FEEDBACK,
  MAYOR_FOLLOWUP_QUESTION,
  NOTICE_BOARD,
  RETRY_CHOICES,
  RETRY_KEEP_FEEDBACK,
  REVIEW_NPC_IDS,
  implementationTwist,
  implementationTwistSpot,
  linaComparePages,
  mayorFinalePages,
  mayorFollowUpChoices,
  mayorReactionPages,
  npcPlanReaction,
  npcReviewOutcome,
  type InvestigationId,
} from '../data/story';
import {
  announceVoice,
  compareVoiceFiles,
  finaleVoiceFiles,
  implementVoiceFiles,
  mayorReactionVoiceFiles,
  reviewVoice,
  smallTalkVoice,
} from '../data/voices';
import { loadSession, saveSession, type QuestStage } from '../data/session';
import { VISIBLE_WORLD_HEIGHT } from '../config';

type Facing = 'down' | 'up' | 'left' | 'right';

/**
 * Quest flow:
 *   lina-intro -> meet-mayor -> investigate -> report -> meeting -> announce
 *   -> expectation -> implement (3 day stops) -> revisit -> debrief
 *   -> retry -> finale -> done
 * Phaser owns progression (it sees proximity + E presses); React owns the
 * modal cards, the notebook, the report picker and the finale card.
 */

const DISTRICT_CARDS: readonly InvestigationId[] = ['baraj', 'tarim', 'konut', 'park'];

const PLAYER_SPEED = 170;

/** The 402px walk frames land at ~56px tall - big enough to read the footwork. */
const PLAYER_SCALE = 0.14;

/** Above every world object, below nothing. */
const UI_DEPTH = 1_000_000;

/** Foot-box for the 251x402 walk frame, in source-image pixels (scaled by PLAYER_SCALE). */
const PLAYER_BODY = { width: 158, height: 76, offsetX: 43, offsetY: 302 };

/** Under every UI cue - ambience should sit in the background, not lead. */
const AMBIENT_VOLUME = 0.28;
const AMBIENT_FADE_MS = 1400;

/** Each district keeps its own ambient loop; crossings crossfade. */
const DISTRICT_AMBIENCE: Record<DistrictId, SoundKey> = {
  reservoir: SoundKeys.AMBIENCE_FOREST,
  agriculture: SoundKeys.AMBIENCE_FOREST,
  park: SoundKeys.AMBIENCE_BIRDS,
  residential: SoundKeys.AMBIENCE_CITY,
  municipality: SoundKeys.AMBIENCE_CITY,
};

/** Step clips inside the 13s footsteps file, used as an audio sprite. */
const STEP_MARKERS = [
  { name: 'step-1', start: 0.2, duration: 0.35 },
  { name: 'step-2', start: 1.6, duration: 0.35 },
  { name: 'step-3', start: 3.2, duration: 0.35 },
  { name: 'step-4', start: 4.8, duration: 0.35 },
];
const STEP_INTERVAL_MS = 220;

/** NPC strips hold one pose per direction: [down, right, up, left]. */
const NPC_FACE_FRAME: Record<Facing, number> = { down: 0, right: 1, up: 2, left: 3 };
const OPPOSITE_FACING: Record<Facing, Facing> = {
  left: 'right',
  right: 'left',
  up: 'down',
  down: 'up',
};

interface Npc {
  definition: NpcDefinition;
  sprite: Phaser.GameObjects.Sprite;
}

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  /** Walk sheet picked by the student's avatar: boy (default) or girl (Lina's). */
  private playerTexture: TextureKey = TextureKeys.PLAYER;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private npcs: Npc[] = [];
  private hint!: Phaser.GameObjects.Text;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'E' | 'M' | 'DEBUG', Phaser.Input.Keyboard.Key>;

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

  // ---- Announcement round (after the meeting, before the epilogue) --------
  /** Solution ids from the submitted package - drives residents' reactions. */
  private planIds: string[] = [];
  /** Residents who already heard the news. */
  private announcedTo = new Set<string>();
  /** The plan poster on the civic notice board. */
  private posterHung = false;
  /** "!" over the notice board while the poster is pending. */
  private boardMarker: Phaser.GameObjects.Text | null = null;

  // ---- Chapter 2: the plan meets reality ------------------------------------
  /** Implementation stop reached: 0 start, 1 mid-month, 2 day 30. -1 = not yet. */
  private implPhase = -1;
  /** Residents whose day-30 review talk was heard. */
  private reviewedBy = new Set<string>();
  /** Sprites/colliders spawned by the implementation - rebuilt on plan retry. */
  private implObjects: Phaser.GameObjects.GameObject[] = [];
  /** World sprites by data id, so the chapter can restyle them (dry fountain). */
  private worldSprites = new Map<string, Phaser.GameObjects.Image>();
  /** Solution ids the world currently shows - switches to the alt plan on retry. */
  private worldPlanIds: string[] = [];
  /**
   * Persistent dressing driven by applyWorldDressing - deliberately NOT part
   * of implObjects so a plan retry only flips visibility, never re-creates.
   */
  private leakDecal: Phaser.GameObjects.Image | null = null;
  private trenchDecal: Phaser.GameObjects.Image | null = null;
  private patchDecal: Phaser.GameObjects.Image | null = null;
  private barrierSprites: Phaser.GameObjects.Image[] = [];
  private fieldHoses: Phaser.GameObjects.Graphics | null = null;
  private leakEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private dustEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private fountainEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  /** Second-chance package ids, if the player ran one. */
  private altPlanIds: string[] | null = null;
  /** Review finding waiting for the dialogue to close before it is logged. */
  private pendingFinding: {
    npcId: string;
    entry: { cardId: string; icon: string; text: string; datum?: string; kind: 'finding' };
  } | null = null;

  // ---- Map view + mini-map feed ---------------------------------------------
  /** true = the camera shows the whole town instead of following the player. */
  private overview = false;
  /** Last emitted mini-map marker signature - only changes are re-sent. */
  private markerSignature = '';
  /** Throttle for the PLAYER_MOVED feed. */
  private lastPosEmit = 0;

  /**
   * The strips have one pose per direction - no walk cycle - so a gentle
   * side-to-side waddle sells the movement instead.
   */
  /** Barely-there breathing while the player stands still. */
  private idleTween: Phaser.Tweens.Tween | null = null;
  private waddling = false;
  /** Last direction Lina walked - keeps her idle frame facing the same way. */
  private linaFacing: Facing = 'down';

  /** Our own collision-box overlays, shown by the debug toggle. */
  private debugShapes: Phaser.GameObjects.Rectangle[] = [];
  private debugVisible = false;

  // ---- Audio ---------------------------------------------------------------
  private ambience: Phaser.Sound.BaseSound | null = null;
  private ambienceKey: SoundKey | null = null;
  private stepTimer = 0;

  // ---- Conversation acting --------------------------------------------------
  /** Wiggle tween running while the active NPC "talks". */
  private talkTween: Phaser.Tweens.Tween | null = null;
  /** The sprite being wiggled - kept so its angle can be restored on close. */
  private talkSprite: Phaser.GameObjects.Sprite | null = null;

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
        margin: sheet.margin ?? 0,
        spacing: sheet.spacing ?? 0,
      });
    }

    for (const audio of AUDIO_ASSETS) {
      this.load.audio(audio.key, audio.path);
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
      this.planIds = saved.plan?.solutionIds ?? [];
      for (const npcId of saved.announcedNpcIds ?? []) this.announcedTo.add(npcId);
      this.posterHung = saved.posterHung ?? false;
      this.implPhase = saved.implPhase ?? -1;
      for (const npcId of saved.reviewedNpcIds ?? []) this.reviewedBy.add(npcId);
      this.altPlanIds = saved.altPlan?.solutionIds ?? null;
      // The world dresses for the most recent run - the alt plan replaces the
      // first one's props once the player retries.
      this.worldPlanIds = saved.altPlan?.solutionIds ?? this.planIds;
      // A stage past the implementation implies the whole timeline ran.
      if (
        this.implPhase < 0 &&
        ['revisit', 'debrief', 'retry', 'finale', 'done'].includes(this.quest)
      ) {
        this.implPhase = 2;
      }
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
    this.createAudio();
    this.createQuestMarkers();
    this.createBoardMarker();
    this.createGuideArrow();
    this.createImplTextures();
    this.createChapterTwoDressing();
    // Restored chapter-2 sessions get their construction sites back.
    this.rebuildImplementation();

    // ...and the time-of-day tint matching the stop they paused at (no
    // calendar animation on resume - 'restore' applies it silently).
    if (this.implPhase >= 0) {
      const stops = [DAY_STOPS.start, DAY_STOPS.mid, DAY_STOPS.end] as const;
      EventBus.emit(GameEvents.DAY_CHANGED, {
        ...stops[Math.min(this.implPhase, stops.length - 1)],
        direction: 'restore',
      });
    }

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
      this.worldSprites.set(object.id, sprite);
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
  private addObstacle(
    box: CollisionBox,
    baseX: number,
    baseY: number,
    id: string,
  ): Phaser.GameObjects.Rectangle {
    return this.addObstacleRect(
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
  ): Phaser.GameObjects.Rectangle {
    const rect = this.add
      .rectangle(centerX, centerY, width, height, 0xff2f6d, 0.35)
      .setOrigin(0.5, 0.5)
      .setDepth(UI_DEPTH - 1)
      .setVisible(this.debugVisible);

    rect.setName(`collider:${id}`);

    this.physics.add.existing(rect, true);
    this.obstacles.add(rect);
    this.debugShapes.push(rect);
    // Implementation colliders can be rebuilt (plan retry) - keep the debug
    // overlay list free of destroyed entries.
    rect.once('destroy', () => {
      this.debugShapes = this.debugShapes.filter((shape) => shape !== rect);
    });
    return rect;
  }

  private createPlayerAnimations(): void {
    for (const [key, anim] of Object.entries(PLAYER_ANIM_FRAMES)) {
      // Guard against duplicate creation if the scene is ever restarted.
      if (this.anims.exists(key)) continue;

      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(TextureKeys.PLAYER, {
          frames: [...anim.frames],
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // Lina shares the player's 3x4 walk layout on her own sheet.
    for (const [dir, frames] of Object.entries(LINA_ANIM_FRAMES)) {
      const key = `lina-${dir}`;
      if (this.anims.exists(key)) continue;

      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(TextureKeys.LINA, {
          frames: [...frames],
        }),
        frameRate: 10,
        repeat: -1,
      });
    }
  }

  private createPlayer(): void {
    // Inset the physics bounds so the sprite's head/feet stay inside the world.
    this.physics.world.setBounds(16, 56, WORLD.width - 32, WORLD.height - 72);

    // The world sprite follows the student's avatar: kız kartı Lina'nın
    // walk sheet'ini kullanır (aynı 3x4 layout, lina-* anims hazır).
    const avatar = loadSession()?.player.avatar;
    this.playerTexture = avatar === TextureKeys.LINA ? TextureKeys.LINA : TextureKeys.PLAYER;
    this.player = this.physics.add
      .sprite(PLAYER_SPAWN.x, PLAYER_SPAWN.y, this.playerTexture)
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

    // Slow breathing while idle keeps the sprite alive between walks.
    this.idleTween = this.tweens.add({
      targets: this.player,
      scaleY: { from: PLAYER_SCALE, to: PLAYER_SCALE * 1.02 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
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

      // Idle breathing - every resident gently sways instead of freezing.
      // Random delay/duration keeps the town from bobbing in sync.
      this.tweens.add({
        targets: sprite,
        scaleY: { from: definition.scale, to: definition.scale * 1.02 },
        duration: 1300 + Math.random() * 600,
        delay: Math.random() * 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

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
      M: Phaser.Input.Keyboard.KeyCodes.M,
      DEBUG: Phaser.Input.Keyboard.KeyCodes.BACKTICK,
    }) as typeof this.keys;
  }

  private createCamera(): void {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD.width, WORLD.height);
    camera.startFollow(this.player, true, 0.1, 0.1);
    const fitZoom = () => camera.setZoom(this.cameraZoom());
    fitZoom();
    this.scale.on('resize', fitZoom);
  }

  /** Close-up follows the player; the overview must fit the whole town. */
  private cameraZoom(): number {
    if (this.overview) {
      return Math.min(this.scale.height / WORLD.height, this.scale.width / WORLD.width);
    }
    return this.scale.height / VISIBLE_WORLD_HEIGHT;
  }

  /** M key / mini-map click: pull the camera out to the whole-town view. */
  private toggleOverview(): void {
    if (this.dialogueOpen) return;
    this.overview = !this.overview;
    const camera = this.cameras.main;
    if (this.overview) {
      this.hint.setVisible(false);
      this.player.setVelocity(0, 0);
      this.stopWaddle();
      camera.stopFollow();
      // Wider-than-world bounds let centerOn actually center the town when
      // the zoomed-out view is broader than the map itself.
      camera.setBounds(-2000, -2000, WORLD.width + 4000, WORLD.height + 4000);
      camera.centerOn(WORLD.width / 2, WORLD.height / 2);
    } else {
      camera.setBounds(0, 0, WORLD.width, WORLD.height);
      camera.startFollow(this.player, true, 0.1, 0.1);
    }
    camera.zoomTo(this.cameraZoom(), 650, 'Sine.easeInOut');
    EventBus.emit(GameEvents.OVERVIEW_CHANGED, { active: this.overview });
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

  /** Same bouncing "!" style as the NPC markers, pinned to the notice board. */
  private createBoardMarker(): void {
    const marker = this.add
      .text(NOTICE_BOARD.x, NOTICE_BOARD.y - 70, '!', {
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
    this.boardMarker = marker;
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
    this.boardMarker?.setVisible(this.quest === 'announce' && !this.posterHung);
    this.emitMinimapMarkers();
  }

  /**
   * Feeds the React mini-map: quest "!"s (at live positions, so follower Lina
   * tracks correctly), one pin per implemented measure, and a warning pin for
   * the mid-month twist. Emitted only when the set actually changes - this
   * runs every frame via refreshQuestMarkers.
   */
  private emitMinimapMarkers(): void {
    const markers: MinimapMarker[] = [];

    for (const [id, marker] of this.questMarkers) {
      if (!marker.visible) continue;
      const npc = this.npcs.find((n) => n.definition.id === id);
      if (npc) markers.push({ x: npc.sprite.x, y: npc.sprite.y, kind: 'quest' });
    }
    if (this.boardMarker?.visible) {
      markers.push({ x: NOTICE_BOARD.x, y: NOTICE_BOARD.y, kind: 'quest' });
    }

    if (this.implPhase >= 0) {
      const spots = new Map<string, { x: number; y: number }>();
      for (let phase = 0; phase <= Math.min(this.implPhase, IMPLEMENTATION_PROPS.length - 1); phase++) {
        for (const prop of IMPLEMENTATION_PROPS[phase]) {
          if (!this.worldPlanIds.includes(prop.solutionId) || spots.has(prop.solutionId)) continue;
          spots.set(prop.solutionId, { x: prop.x, y: prop.y });
        }
      }
      for (const spot of spots.values()) markers.push({ ...spot, kind: 'impl' });
    }

    if (this.implPhase >= 1) {
      const twist = implementationTwistSpot(this.worldPlanIds);
      if (twist) markers.push({ ...twist, kind: 'warning' });
    }

    const signature = JSON.stringify(markers);
    if (signature === this.markerSignature) return;
    this.markerSignature = signature;
    EventBus.emit(GameEvents.MARKERS_CHANGED, { markers });
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
      case 'announce':
        if (npc.definition.id === 'lina') return this.announceComplete();
        return ANNOUNCE_NPC_IDS.includes(npc.definition.id) && !this.announcedTo.has(npc.definition.id);
      case 'expectation':
      case 'implement':
      case 'retry':
        return npc.definition.id === 'lina';
      case 'revisit':
        return REVIEW_NPC_IDS.includes(npc.definition.id) && !this.reviewedBy.has(npc.definition.id);
      case 'debrief':
      case 'finale':
        return id === 'belediye';
      default:
        return false;
    }
  }

  /** All four day-30 review talks heard - time to report to the mayor. */
  private reviewComplete(): boolean {
    return REVIEW_NPC_IDS.every((id) => this.reviewedBy.has(id));
  }

  /** Every resident told + poster hung - Lina gets the closing word. */
  private announceComplete(): boolean {
    return this.posterHung && ANNOUNCE_NPC_IDS.every((id) => this.announcedTo.has(id));
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

    if (
      this.quest === 'report' ||
      this.quest === 'expectation' ||
      this.quest === 'implement' ||
      this.quest === 'retry'
    ) {
      return this.lina ? { x: this.lina.sprite.x, y: this.lina.sprite.y } : null;
    }

    if (this.quest === 'announce' || this.quest === 'revisit') {
      const spots: { x: number; y: number }[] = this.npcs
        .filter((n) => this.isQuestTarget(n))
        .map((n) => ({ x: n.sprite.x, y: n.sprite.y }));
      if (this.quest === 'announce' && !this.posterHung)
        spots.push({ x: NOTICE_BOARD.x, y: NOTICE_BOARD.y });
      if (spots.length === 0) return null;
      return spots.reduce((a, b) =>
        Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y) <
        Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y)
          ? b
          : a,
      );
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
    saveSession({
      ...saved,
      quest: this.quest,
      completedCards: [...this.completedCards],
      announcedNpcIds: [...this.announcedTo],
      posterHung: this.posterHung,
      implPhase: this.implPhase,
      reviewedNpcIds: [...this.reviewedBy],
    });
  }

  private startLinaIntro(): void {
    if (this.quest !== 'lina-intro' || !this.lina) return;
    this.beginConversation(this.lina, false);
    EventBus.emit(GameEvents.OPEN_DIALOGUE, {
      npcId: 'lina',
      name: 'Lina',
      text: LINA_INTRO_PAGES[0],
      pages: [...LINA_INTRO_PAGES.slice(1)],
      voiceFiles: ['lina-intro-01.mp3', 'lina-intro-02.mp3', 'lina-intro-03.mp3'],
    });
  }

  private openInvestigation(npc: Npc, cardId: InvestigationId): void {
    this.beginConversation(npc);
    EventBus.emit(GameEvents.OPEN_INVESTIGATION, { cardId });
  }

  private handleInvestigationCompleted(cardId: string): void {
    const anchor = this.activeNpc?.sprite ?? this.player;
    this.endConversation();
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
      case 'announce': {
        if (this.announceComplete()) {
          this.setObjective('Lina ile konuş');
          break;
        }
        const parts = [`Planı halka duyur (${this.announcedTo.size}/${ANNOUNCE_NPC_IDS.length})`];
        if (!this.posterHung) parts.push('duyuruyu panoda paylaş');
        this.setObjective(parts.join(' + '));
        break;
      }
      case 'expectation':
        this.setObjective('Lina ile konuş');
        break;
      case 'implement':
        this.setObjective('Uygulamayı izle - Lina ile konuş');
        break;
      case 'revisit':
        this.setObjective(
          `Kasabayı yeniden incele: değişenleri dinle (${this.reviewedBy.size}/${REVIEW_NPC_IDS.length})`,
        );
        break;
      case 'debrief':
        this.setObjective('Belediyeye dön ve ilk raporunu sun');
        break;
      case 'retry':
        this.setObjective('Lina ile konuş');
        break;
      case 'finale':
        this.setObjective('Başkan ile konuş - final sunumu');
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
    if (this.followTrail.length > 90) this.followTrail.shift();

    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, lina.x, lina.y);
    // Never lag absurdly far behind (e.g. after a long walk or a tight corner).
    if (distance > 420) {
      lina.setPosition(this.player.x - 30, this.player.y + 10);
      this.followTrail.length = 0;
      return;
    }

    const lag = this.followTrail[0];
    const gap = Phaser.Math.Distance.Between(lina.x, lina.y, lag.x, lag.y);
    if (gap < 34) {
      lina.setDepth(lina.y);
      lina.anims.stop();
      lina.setFrame(LINA_IDLE_FRAMES[this.linaFacing]);
      return;
    }
    const speed = Math.min(PLAYER_SPEED * 1.05, gap * 6);
    const step = (speed * delta) / 1000;
    lina.x += ((lag.x - lina.x) / gap) * step;
    lina.y += ((lag.y - lina.y) / gap) * step;
    lina.setDepth(lina.y);

    const dx = lag.x - lina.x;
    const dy = lag.y - lina.y;
    this.linaFacing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    lina.anims.play(`lina-${this.linaFacing}`, true);
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
    EventBus.on(GameEvents.REPORT_SUBMITTED, this.handleReportSubmitted, this);
    EventBus.on(GameEvents.FINALE_SUBMITTED, this.handleFinaleSubmitted, this);
    EventBus.on(GameEvents.AUDIO_MUTED, this.handleAudioMuted, this);
    EventBus.on(GameEvents.MAP_TOGGLED, this.toggleOverview, this);
    EventBus.on(GameEvents.ANNOUNCE_SUBMITTED, this.handleAnnounceSubmitted, this);

    // Scenes outlive neither the game nor React, so unbind on shutdown to avoid
    // stacking duplicate handlers if the scene is ever restarted.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(GameEvents.DIALOGUE_CLOSED, this.handleDialogueClosed, this);
      EventBus.off(GameEvents.DIALOGUE_CHOICE, this.handleDialogueChoice, this);
      EventBus.off(GameEvents.INVESTIGATION_COMPLETED, this.onInvestigationCompleted, this);
      EventBus.off(GameEvents.EVIDENCE_SUBMITTED, this.handleEvidenceSubmitted, this);
      EventBus.off(GameEvents.PLAN_SUBMITTED, this.handlePlanSubmitted, this);
      EventBus.off(GameEvents.REPORT_SUBMITTED, this.handleReportSubmitted, this);
      EventBus.off(GameEvents.FINALE_SUBMITTED, this.handleFinaleSubmitted, this);
      EventBus.off(GameEvents.AUDIO_MUTED, this.handleAudioMuted, this);
      EventBus.off(GameEvents.MAP_TOGGLED, this.toggleOverview, this);
      EventBus.off(GameEvents.ANNOUNCE_SUBMITTED, this.handleAnnounceSubmitted, this);
    });
  }

  private handleAudioMuted(payload: { muted: boolean }): void {
    this.sound.mute = payload.muted;
  }

  private onInvestigationCompleted(payload: { cardId: string }): void {
    this.handleInvestigationCompleted(payload.cardId);
  }

  private handleDialogueClosed(): void {
    const wasIntro = this.quest === 'lina-intro' && this.activeNpc?.definition.id === 'lina';
    const wasReport = this.quest === 'report' && this.activeNpc?.definition.id === 'lina';
    const announcedId =
      this.quest === 'announce' &&
      this.activeNpc &&
      ANNOUNCE_NPC_IDS.includes(this.activeNpc.definition.id) &&
      !this.announcedTo.has(this.activeNpc.definition.id)
        ? this.activeNpc.definition.id
        : null;
    const wasImplementTalk =
      this.quest === 'implement' && this.activeNpc?.definition.id === 'lina';
    const wasReview =
      this.quest === 'revisit' &&
      this.pendingFinding !== null &&
      this.activeNpc?.definition.id === this.pendingFinding.npcId;
    const wasDebrief =
      this.quest === 'debrief' && this.activeNpc?.definition.id === 'mayor';
    const wasFinaleTalk =
      this.quest === 'finale' && this.activeNpc?.definition.id === 'mayor';
    this.endConversation();

    if (wasIntro) {
      this.quest = 'meet-mayor';
      this.refreshQuestMarkers();
      this.emitObjective();
    } else if (wasReport) {
      // React now opens the notebook in evidence-marking mode; the quest only
      // advances to the meeting once the player submits the marked causes.
      EventBus.emit(GameEvents.OPEN_EVIDENCE);
    } else if (announcedId) {
      this.announcedTo.add(announcedId);
      this.showToast('Planı duydu! ✓', this.player.x, this.player.y - 90);
      if (this.announceComplete()) this.playSlice(SoundKeys.COMPLETE, 0, 1800, 0.6);
      this.refreshQuestMarkers();
      this.emitObjective();
    } else if (wasImplementTalk) {
      this.advanceImplementation();
    } else if (wasReview) {
      this.completeReviewTalk();
    } else if (wasDebrief) {
      // React opens the notebook so the player picks the findings to cite.
      EventBus.emit(GameEvents.OPEN_REPORT);
    } else if (wasFinaleTalk) {
      // React shows the run comparison + the closing statement card.
      EventBus.emit(GameEvents.OPEN_FINALE);
    }
  }

  /** The 30-day timeline advances one story stop each time Lina is heard. */
  private advanceImplementation(): void {
    this.implPhase += 1;
    if (this.implPhase === 1) {
      this.spawnImplementationPhase(1);
      EventBus.emit(GameEvents.DAY_CHANGED, { ...DAY_STOPS.mid, direction: 'forward' });
    } else if (this.implPhase >= 2) {
      this.implPhase = 2;
      EventBus.emit(GameEvents.DAY_CHANGED, { ...DAY_STOPS.end, direction: 'forward' });
      this.quest = 'revisit';
    }
    this.refreshQuestMarkers();
    this.emitObjective();
  }

  /** The review talk ended: log its finding, then maybe open the debrief. */
  private completeReviewTalk(): void {
    const pending = this.pendingFinding;
    this.pendingFinding = null;
    if (!pending) return;

    this.reviewedBy.add(pending.npcId);
    EventBus.emit(GameEvents.FINDING_ADDED, { entry: pending.entry });
    this.showToast('Bulgu deftere eklendi! 📒', this.player.x, this.player.y - 90);
    if (this.reviewComplete()) {
      this.playSlice(SoundKeys.COMPLETE, 0, 1800, 0.6);
      this.quest = 'debrief';
    }
    this.refreshQuestMarkers();
    this.emitObjective();
  }

  private handleEvidenceSubmitted(): void {
    if (this.quest !== 'report') return;
    this.quest = 'meeting';
    this.refreshQuestMarkers();
    this.emitObjective();
  }

  private handlePlanSubmitted(payload: { solutionIds: string[] }): void {
    // Second-chance run: the world re-dresses for the new plan and Lina
    // narrates the comparison; the finale follows.
    if (this.quest === 'retry') {
      this.altPlanIds = payload.solutionIds;
      this.worldPlanIds = payload.solutionIds;
      this.implPhase = Math.max(this.implPhase, 0);
      this.rebuildImplementation();
      this.quest = 'finale';
      this.refreshQuestMarkers();
      this.emitObjective();
      EventBus.emit(GameEvents.DAY_CHANGED, { ...DAY_STOPS.retry, direction: 'back' });

      const pages = linaComparePages(this.planIds, this.altPlanIds);
      if (this.lina) this.beginConversation(this.lina);
      EventBus.emit(GameEvents.OPEN_DIALOGUE, {
        npcId: 'lina',
        name: 'Lina',
        text: pages[0],
        pages: pages.slice(1),
        voiceFiles: compareVoiceFiles(this.planIds, this.altPlanIds),
      });
      return;
    }

    if (this.quest !== 'meeting') return;
    this.quest = 'announce';
    this.planIds = payload.solutionIds;
    this.worldPlanIds = payload.solutionIds;
    this.refreshQuestMarkers();
    this.emitObjective();

    // The mayor reacts to the package: who it serves, what was left out.
    const mayor = this.npcs.find((npc) => npc.definition.id === 'mayor');
    if (mayor) this.beginConversation(mayor);
    this.showToast('Çözüm planın belediyeye teslim edildi! 🎉', this.player.x, this.player.y - 90);
    EventBus.emit(GameEvents.OPEN_DIALOGUE, {
      npcId: 'mayor',
      name: 'Belediye Başkanı',
      text: mayorReactionPages(payload.solutionIds)[0],
      pages: mayorReactionPages(payload.solutionIds).slice(1),
      voiceFiles: mayorReactionVoiceFiles(payload.solutionIds),
    });
  }

  private handleDialogueChoice(choiceId: string): void {
    // Lina's reflective closer now opens chapter 2 instead of ending the game.
    if (choiceId in LINA_CLOSING_FEEDBACK) {
      const anchor = this.activeNpc?.sprite ?? this.player;
      this.showToast(LINA_CLOSING_FEEDBACK[choiceId], anchor.x, anchor.y - anchor.displayHeight - 10);
      this.playSlice(SoundKeys.COMPLETE, 0, 2000, 0.7);
      this.quest = 'expectation';
      this.endConversation();
      this.refreshQuestMarkers();
      this.emitObjective();
      return;
    }

    // The player's prediction - stored so the finale can revisit it.
    if (choiceId in EXPECTATION_FEEDBACK) {
      const anchor = this.activeNpc?.sprite ?? this.player;
      this.showToast(EXPECTATION_FEEDBACK[choiceId], anchor.x, anchor.y - anchor.displayHeight - 10);
      const text = EXPECTATION_CHOICES.find((c) => c.id === choiceId)?.text;
      const saved = loadSession();
      if (saved && text) saveSession({ ...saved, expectation: text });

      this.quest = 'implement';
      this.implPhase = 0;
      this.spawnImplementationPhase(0);
      this.endConversation();
      EventBus.emit(GameEvents.DAY_CHANGED, { ...DAY_STOPS.start, direction: 'forward' });
      this.refreshQuestMarkers();
      this.emitObjective();
      return;
    }

    // The mayor's debrief follow-up - whichever gap the player named.
    if (choiceId in MAYOR_FOLLOWUP_FEEDBACK) {
      const anchor = this.activeNpc?.sprite ?? this.player;
      this.showToast(MAYOR_FOLLOWUP_FEEDBACK[choiceId], anchor.x, anchor.y - anchor.displayHeight - 10);
      this.playSlice(SoundKeys.COMPLETE, 0, 1600, 0.6);
      this.quest = 'retry';
      this.endConversation();
      this.refreshQuestMarkers();
      this.emitObjective();
      return;
    }

    // Lina's second-chance offer.
    if (choiceId === 'retry-alt') {
      // The solution panel reopens in retry mode; the player stays frozen
      // (dialogueOpen) until the package is submitted.
      this.stopConversationFx();
      this.activeNpc = null;
      EventBus.emit(GameEvents.OPEN_SOLUTION, { mode: 'retry' });
      return;
    }
    if (choiceId === 'retry-keep') {
      const anchor = this.activeNpc?.sprite ?? this.player;
      this.showToast(RETRY_KEEP_FEEDBACK, anchor.x, anchor.y - anchor.displayHeight - 10);
      this.playSlice(SoundKeys.COMPLETE, 0, 1800, 0.6);
      this.quest = 'finale';
      this.endConversation();
      this.refreshQuestMarkers();
      this.emitObjective();
      return;
    }

    const message = DECISION_FEEDBACK[choiceId] ?? 'Bir karar verdin.';

    // Show the acknowledgement over whoever the player was talking to.
    const anchor = this.activeNpc?.sprite ?? this.player;
    this.showToast(message, anchor.x, anchor.y - anchor.displayHeight - 10);

    this.endConversation();
  }

  /** The debrief findings were picked: the mayor asks the follow-up. */
  private handleReportSubmitted(): void {
    if (this.quest !== 'debrief') return;
    const mayor = this.npcs.find((npc) => npc.definition.id === 'mayor');
    if (mayor) this.beginConversation(mayor);
    EventBus.emit(GameEvents.OPEN_DIALOGUE, {
      npcId: 'mayor',
      name: 'Belediye Başkanı',
      text: MAYOR_FOLLOWUP_QUESTION,
      choices: mayorFollowUpChoices(this.planIds),
      voiceFiles: ['mayor-followup.mp3'],
    });
  }

  /** The closing statement was written - the chapter is truly over. */
  private handleFinaleSubmitted(): void {
    if (this.quest !== 'finale') return;
    this.quest = 'done';
    this.endConversation();
    this.playSlice(SoundKeys.COMPLETE, 0, 2200, 0.7);
    this.showToast(
      'Kapanış değerlendirmen kaydedildi - Denge Kasabası iyi düşünen birine emanet! 🎉',
      this.player.x,
      this.player.y - 90,
    );
    this.refreshQuestMarkers();
    this.emitObjective();
  }

  // ---- Chapter 2 world dressing ---------------------------------------------

  /** Spawn the props one implementation stop adds (they accumulate). */
  private spawnImplementationPhase(phase: number): void {
    const props = IMPLEMENTATION_PROPS[phase] ?? [];
    for (const prop of props) {
      if (!this.worldPlanIds.includes(prop.solutionId)) continue;
      const sprite = this.add
        .image(prop.x, prop.y, prop.textureKey)
        .setOrigin(0.5, 1)
        .setScale(prop.scale ?? 1)
        .setAlpha(0);
      if (prop.ground) {
        sprite.setDepth(GroundDepth.DECAL + 10);
      } else {
        sprite.setDepth(prop.y);
      }
      this.tweens.add({ targets: sprite, alpha: 1, duration: 600 });
      this.implObjects.push(sprite);
      if (prop.collision) {
        this.implObjects.push(
          this.addObstacle(prop.collision, prop.x, prop.y, `impl-${prop.solutionId}-${prop.x}`),
        );
      }
    }
    this.applyWorldDressing();
  }

  /**
   * Clears and respawns every implementation prop. Used on restore and when
   * the retry replaces the world with the alternative plan's timeline.
   */
  private rebuildImplementation(): void {
    for (const object of this.implObjects) object.destroy();
    this.implObjects = [];
    if (this.implPhase < 0) {
      this.applyWorldDressing();
      return;
    }
    for (let phase = 0; phase <= Math.min(this.implPhase, IMPLEMENTATION_PROPS.length - 1); phase++) {
      this.spawnImplementationPhase(phase);
    }
  }

  /** Nuri's street, on the avenue's south edge - the leak lives here. */
  private static readonly LEAK_SPOT = { x: 1500, y: 786 } as const;

  /** One-time canvas textures for chapter-2 dressing: barrier, patch, particles. */
  private createImplTextures(): void {
    const g = this.add.graphics();

    // Striped worksite barrier: pale legs + white board with red stripes.
    g.fillStyle(0xb8b2a4);
    g.fillRect(8, 14, 5, 20);
    g.fillRect(51, 14, 5, 20);
    g.fillStyle(0xf4f0e6).fillRoundedRect(0, 0, 64, 16, 3);
    g.fillStyle(0xc9503d);
    for (let i = 0; i < 4; i++) g.fillRect(5 + i * 15, 2, 7, 12);
    g.lineStyle(1.5, 0x8f887a).strokeRoundedRect(0, 0, 64, 16, 3);
    g.generateTexture('impl-barrier', 64, 34);
    g.clear();

    // Fresh asphalt patch where the trench was closed.
    g.fillStyle(0x50555c).fillEllipse(55, 18, 110, 36);
    g.lineStyle(2, 0x43474d).strokeEllipse(55, 18, 110, 36);
    g.lineStyle(1, 0x62676e, 0.7);
    g.lineBetween(20, 14, 90, 22);
    g.lineBetween(30, 24, 80, 10);
    g.generateTexture('street-patch', 110, 36);
    g.clear();

    // Water drop + dust puff particles.
    g.fillStyle(0x7ec4e8).fillCircle(4, 4, 3);
    g.generateTexture('fx-drop', 8, 8);
    g.clear();
    g.fillStyle(0xc9b891, 0.9).fillCircle(6, 6, 6);
    g.generateTexture('fx-dust', 12, 12);
    g.destroy();
  }

  /** Persistent chapter-2 dressing; applyWorldDressing flips its visibility. */
  private createChapterTwoDressing(): void {
    const { x: lx, y: ly } = GameScene.LEAK_SPOT;

    // The leak is a pre-existing problem - on stage from chapter 1.
    this.leakDecal = this.add
      .image(lx, ly, TextureKeys.STREET_LEAK)
      .setOrigin(0.5)
      .setScale(0.15)
      .setDepth(GroundDepth.DECAL + 5);
    this.trenchDecal = this.add
      .image(lx, ly, TextureKeys.PIPE_TRENCH)
      .setOrigin(0.5)
      .setScale(0.15)
      .setDepth(GroundDepth.DECAL + 5)
      .setVisible(false);
    this.patchDecal = this.add
      .image(lx, ly, 'street-patch')
      .setOrigin(0.5)
      .setDepth(GroundDepth.DECAL + 5)
      .setVisible(false);

    for (const dx of [-70, 70]) {
      this.barrierSprites.push(
        this.add
          .image(lx + dx, ly + 16, 'impl-barrier')
          .setOrigin(0.5, 1)
          .setScale(0.9)
          .setDepth(ly + 16)
          .setVisible(false),
      );
    }

    this.leakEmitter = this.add
      .particles(lx, ly + 2, 'fx-drop', {
        speedY: { min: -46, max: -22 },
        speedX: { min: -14, max: 14 },
        lifespan: 650,
        frequency: 420,
        scale: { start: 1, end: 0.3 },
        alpha: { start: 0.9, end: 0 },
      })
      .setDepth(GroundDepth.DECAL + 6);

    this.dustEmitter = this.add
      .particles(lx, ly + 8, 'fx-dust', {
        speed: { min: 8, max: 24 },
        angle: { min: 200, max: 340 },
        lifespan: 1700,
        frequency: 420,
        scale: { start: 0.5, end: 1.6 },
        alpha: { start: 0.3, end: 0 },
      })
      .setDepth(GroundDepth.DECAL + 7);
    this.dustEmitter.stop();

    // Drips falling from the fountain's upper tiers - the "running" state.
    this.fountainEmitter = this.add
      .particles(PARK_CENTER.x, 728, 'fx-drop', {
        speedY: { min: 26, max: 55 },
        speedX: { min: -20, max: 20 },
        lifespan: 850,
        frequency: 130,
        scale: { start: 0.9, end: 0.3 },
        alpha: { start: 0.8, end: 0.1 },
      })
      .setDepth(792);

    // Drip hoses trace the field's vertical crop rows; emitter dots mark them.
    const hoses = this.add.graphics().setDepth(GroundDepth.DECAL + 2).setVisible(false);
    hoses.lineStyle(3, 0x24301a, 0.9);
    for (const hx of [340, 368, 396, 424, 452]) hoses.lineBetween(hx, 936, hx, 1084);
    hoses.lineStyle(4, 0x24301a, 0.9);
    hoses.lineBetween(336, 1088, 470, 1088);
    hoses.lineBetween(470, 930, 470, 1088);
    hoses.fillStyle(0x88c7e8, 1);
    for (const hx of [340, 368, 396, 424, 452]) {
      for (const hy of [960, 1010, 1060]) hoses.fillCircle(hx, hy, 2.2);
    }
    this.fieldHoses = hoses;
  }

  /**
   * Plan consequences on the world: leak -> trench -> repaired patch on
   * Nuri's street, fountain running/dry, drip hoses and field tinting.
   * Derived purely from worldPlanIds + implPhase, so restores and the
   * alternative-plan retry always land on a consistent state.
   */
  private applyWorldDressing(): void {
    const started = this.implPhase >= 0;
    const settled = this.implPhase >= 1;
    const pipes = this.worldPlanIds.includes('repair-pipes');
    const fountainsOff = started && this.worldPlanIds.includes('fountains-off');
    const drip = this.worldPlanIds.includes('drip-irrigation');

    const leakVisible = !pipes || !started;
    this.leakDecal?.setVisible(leakVisible);
    if (this.leakEmitter) {
      this.leakEmitter.setVisible(leakVisible);
      if (leakVisible) this.leakEmitter.start();
      else this.leakEmitter.stop();
    }

    const worksite = pipes && started && !settled;
    this.trenchDecal?.setVisible(worksite);
    for (const barrier of this.barrierSprites) barrier.setVisible(worksite);
    if (this.dustEmitter) {
      this.dustEmitter.setVisible(worksite);
      if (worksite) this.dustEmitter.start();
      else this.dustEmitter.stop();
    }

    this.patchDecal?.setVisible(pipes && settled);

    const fountain = this.worldSprites.get('park-fountain');
    if (fountain) {
      if (fountainsOff) fountain.setTint(0x8d9aa3);
      else fountain.clearTint();
    }
    if (this.fountainEmitter) {
      this.fountainEmitter.setVisible(!fountainsOff);
      if (fountainsOff) this.fountainEmitter.stop();
      else this.fountainEmitter.start();
    }

    this.fieldHoses?.setVisible(drip && settled);
    const field = this.worldSprites.get('field-veg');
    if (field) {
      if (!drip && this.implPhase >= 2) field.setTint(0xc9ae72);
      else field.clearTint();
    }
  }

  /** Shared freeze + emit for every NPC dialogue card. */
  // ---- Conversation acting --------------------------------------------------
  // Every talk runs through these helpers so NPCs consistently turn to the
  // player, step closer like Lina's intro, and gesture while the card is open.

  private beginConversation(npc: Npc, playCue = true): void {
    this.dialogueOpen = true;
    this.activeNpc = npc;
    this.player.setVelocity(0, 0);
    this.player.anims.stop();
    this.stopWaddle();
    this.faceEachOther(npc);
    this.hint.setVisible(false);
    this.startTalkAnim(npc);
    if (playCue) this.playDialogueCue();
  }

  /** The NPC turns toward the player; the player turns back. */
  private faceEachOther(npc: Npc): void {
    const dx = this.player.x - npc.sprite.x;
    const dy = this.player.y - npc.sprite.y;
    const facing: Facing =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    if (npc.definition.followsPlayer) {
      // Lina's sheet is animated - freeze her on the matching idle frame.
      this.linaFacing = facing;
      npc.sprite.anims.stop();
      npc.sprite.setFrame(LINA_IDLE_FRAMES[facing]);
    } else {
      npc.sprite.setFrame(NPC_FACE_FRAME[facing]);
    }
    this.facing = OPPOSITE_FACING[facing];
    this.setIdleFrame();
  }

  /**
   * Lina'nın girişteki gibi: NPC birkaç adım oyuncuya doğru gelir, açı
   * wiggle'ı yürüyüş hissi verir; kart açık kaldıkça jest yapmayı sürdürür.
   */
  private startTalkAnim(npc: Npc): void {
    this.stopTalkAnim();
    this.talkSprite = npc.sprite;

    // Follower Lina zaten oyuncunun dibinde - sabit NPC'ler yaklaşır.
    if (!npc.definition.followsPlayer) {
      const dx = this.player.x - npc.sprite.x;
      const dy = this.player.y - npc.sprite.y;
      const dist = Math.hypot(dx, dy) || 1;
      const step = Math.min(18, dist * 0.25);
      this.tweens.add({
        targets: npc.sprite,
        x: npc.sprite.x + (dx / dist) * step,
        y: npc.sprite.y + (dy / dist) * step,
        duration: 320,
        ease: 'Quad.easeOut',
        onUpdate: () => npc.sprite.setDepth(npc.sprite.y),
      });
    }

    this.talkTween = this.tweens.add({
      targets: npc.sprite,
      angle: { from: -2.4, to: 2.4 },
      duration: 240,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private stopTalkAnim(): void {
    this.talkTween?.stop();
    this.talkTween = null;
    this.talkSprite?.setAngle(0);
    this.talkSprite = null;
  }

  /** The NPC walks back to its spot; follower Lina just resumes trailing. */
  private returnNpcHome(npc: Npc): void {
    if (npc.definition.followsPlayer) return;
    const { x, y, frame } = npc.definition;
    if (Math.abs(npc.sprite.x - x) < 1 && Math.abs(npc.sprite.y - y) < 1) return;
    this.tweens.add({
      targets: npc.sprite,
      x,
      y,
      duration: 340,
      ease: 'Quad.easeInOut',
      onUpdate: () => npc.sprite.setDepth(npc.sprite.y),
      onComplete: () => npc.sprite.setFrame(frame),
    });
  }

  /** Stop the acting (wiggle) but keep the conversation flags. */
  private stopConversationFx(): void {
    this.stopTalkAnim();
  }

  private endConversation(): void {
    const npc = this.activeNpc;
    this.stopConversationFx();
    this.dialogueOpen = false;
    this.activeNpc = null;
    if (npc) this.returnNpcHome(npc);
  }

  private presentDialogue(npc: Npc, payload: DialoguePayload): void {
    this.beginConversation(npc);
    EventBus.emit(GameEvents.OPEN_DIALOGUE, payload);
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
      this.beginConversation(npc);
      EventBus.emit(GameEvents.OPEN_SOLUTION, { mode: 'initial' });
      return;
    }

    // In the report stage Lina closes the chapter instead of small talk.
    if (npc.definition.id === 'lina' && this.quest === 'report') {
      this.presentDialogue(npc, {
        npcId: 'lina',
        name: 'Lina',
        text: LINA_REPORT_TEXT,
        voiceFiles: ['lina-report.mp3'],
      });
      return;
    }

    // Announcement round: residents react to what the plan actually picked.
    if (
      this.quest === 'announce' &&
      ANNOUNCE_NPC_IDS.includes(npc.definition.id) &&
      !this.announcedTo.has(npc.definition.id)
    ) {
      const reaction = npcPlanReaction(npc.definition.id, this.planIds);
      if (reaction) {
        this.presentDialogue(npc, {
          npcId: npc.definition.id,
          name: npc.definition.name,
          text: reaction,
          voiceFiles: announceVoice(npc.definition.id, this.planIds),
        });
        return;
      }
    }

    // Once every resident knows, Lina asks the reflective closing question.
    if (npc.definition.id === 'lina' && this.quest === 'announce' && this.announceComplete()) {
      this.presentDialogue(npc, {
        npcId: 'lina',
        name: 'Lina',
        text: LINA_CLOSING_PAGES[0],
        pages: [...LINA_CLOSING_PAGES.slice(1)],
        choices: [...LINA_CLOSING_CHOICES],
        voiceFiles: ['lina-closing-01.mp3', 'lina-closing-02.mp3'],
      });
      return;
    }

    // ---- Chapter 2 ----------------------------------------------------------

    // Lina asks what the player expects before the month starts.
    if (npc.definition.id === 'lina' && this.quest === 'expectation') {
      this.presentDialogue(npc, {
        npcId: 'lina',
        name: 'Lina',
        text: LINA_EXPECTATION_PAGES[0],
        pages: [...LINA_EXPECTATION_PAGES.slice(1)],
        choices: [...EXPECTATION_CHOICES],
        voiceFiles: ['lina-expect-01.mp3', 'lina-expect-02.mp3'],
      });
      return;
    }

    // Each Lina talk during the implementation advances to the next day stop.
    if (npc.definition.id === 'lina' && this.quest === 'implement') {
      const twist = this.implPhase === 0 ? implementationTwist(this.planIds) : null;
      const pages =
        this.implPhase === 0
          ? [...IMPLEMENT_MID_PAGES, ...(twist ? [twist] : [])]
          : [...IMPLEMENT_END_PAGES];
      this.presentDialogue(npc, {
        npcId: 'lina',
        name: 'Lina',
        text: pages[0],
        pages: pages.slice(1),
        voiceFiles: implementVoiceFiles(this.implPhase, this.planIds),
      });
      return;
    }

    // Review round: same residents, new question - what changed?
    if (
      this.quest === 'revisit' &&
      REVIEW_NPC_IDS.includes(npc.definition.id) &&
      !this.reviewedBy.has(npc.definition.id)
    ) {
      const outcome = npcReviewOutcome(npc.definition.id, this.planIds);
      if (outcome) {
        this.pendingFinding = {
          npcId: npc.definition.id,
          entry: {
            cardId: `finding-${npc.definition.id}`,
            kind: 'finding',
            ...outcome.finding,
          },
        };
        this.presentDialogue(npc, {
          npcId: npc.definition.id,
          name: npc.definition.name,
          text: outcome.text,
          chart: outcome.chart,
          voiceFiles: reviewVoice(npc.definition.id, this.planIds),
        });
        return;
      }
    }

    // The mayor opens the town report - findings get picked after this talk.
    if (cardId === 'belediye' && this.quest === 'debrief') {
      this.presentDialogue(npc, {
        npcId: 'mayor',
        name: 'Belediye Başkanı',
        text: MAYOR_DEBRIEF_PAGES[0],
        pages: [...MAYOR_DEBRIEF_PAGES.slice(1)],
        voiceFiles: ['mayor-debrief-01.mp3', 'mayor-debrief-02.mp3'],
      });
      return;
    }

    // Lina offers the second chance: same start, different decision.
    if (npc.definition.id === 'lina' && this.quest === 'retry') {
      this.presentDialogue(npc, {
        npcId: 'lina',
        name: 'Lina',
        text: LINA_RETRY_PAGES[0],
        pages: [...LINA_RETRY_PAGES.slice(1)],
        choices: [...RETRY_CHOICES],
        voiceFiles: ['lina-retry-01.mp3', 'lina-retry-02.mp3'],
      });
      return;
    }

    // The mayor's evaluation opens the finale card on close.
    if (cardId === 'belediye' && this.quest === 'finale') {
      this.presentDialogue(npc, {
        npcId: 'mayor',
        name: 'Belediye Başkanı',
        text: mayorFinalePages(this.altPlanIds !== null)[0],
        pages: mayorFinalePages(this.altPlanIds !== null).slice(1),
        voiceFiles: finaleVoiceFiles(this.altPlanIds !== null),
      });
      return;
    }

    // The chapter-1 demo decisions retire once the real plan exists - in
    // chapter 2 residents only talk, they no longer offer stat choices.
    const chapterOne =
      this.quest === 'lina-intro' ||
      this.quest === 'meet-mayor' ||
      this.quest === 'investigate' ||
      this.quest === 'report' ||
      this.quest === 'meeting' ||
      this.quest === 'announce';

    this.presentDialogue(npc, {
      npcId: npc.definition.id,
      name: npc.definition.name,
      text: npc.definition.dialogue.text,
      choices: chapterOne ? npc.definition.dialogue.choices : [],
      voiceFiles: smallTalkVoice(npc.definition.id),
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
    this.setAmbience(DISTRICT_AMBIENCE[district.id]);
  }

  // =========================================================================
  // AUDIO
  // =========================================================================

  /**
   * Sound setup: honour the saved speaker toggle. The ambient loop itself
   * starts with the first `updateDistrict` call.
   */
  private createAudio(): void {
    this.sound.mute = loadSession()?.muted ?? false;
  }

  /** Crossfade into a new ambient loop when the district changes. */
  private setAmbience(key: SoundKey): void {
    if (key === this.ambienceKey) return;
    this.ambienceKey = key;

    const previous = this.ambience;
    if (previous) {
      this.tweens.add({
        targets: previous,
        volume: 0,
        duration: AMBIENT_FADE_MS,
        onComplete: () => previous.stop(),
      });
    }

    const next = this.sound.add(key, { loop: true });
    next.play({ volume: 0 });
    this.tweens.add({ targets: next, volume: AMBIENT_VOLUME, duration: AMBIENT_FADE_MS });
    this.ambience = next;
  }

  /**
   * Plays a short slice out of a longer file: seek in, fade out, stop. The
   * source files hold whole walks/murmurs - this is the lightweight stand-in
   * for audio-sprite markers.
   */
  private playSlice(key: SoundKey, seek: number, ms: number, volume: number): void {
    const sound = this.sound.add(key);
    sound.play({ seek, volume });
    if (ms > 400) {
      this.tweens.add({ targets: sound, volume: 0, duration: 250, delay: ms - 250 });
    }
    this.time.delayedCall(ms, () => {
      // Kill first: a pending volume tween would write to a destroyed sound.
      this.tweens.killTweensOf(sound);
      sound.stop();
      sound.destroy();
    });
  }

  /** Throttled footstep ticks while the player is moving. */
  private playStep(): void {
    const seek = STEP_MARKERS[Math.floor(Math.random() * STEP_MARKERS.length)].start;
    this.playSlice(SoundKeys.STEP, seek, STEP_MARKERS[0].duration * 1000, 0.35);
  }

  // =========================================================================
  // UPDATE
  // =========================================================================

  update(time: number, delta: number): void {
    if (!this.player || !this.keys) return;

    if (Phaser.Input.Keyboard.JustDown(this.keys.DEBUG)) this.toggleDebug();
    if (Phaser.Input.Keyboard.JustDown(this.keys.M)) this.toggleOverview();

    this.updateGuideArrow();
    this.refreshQuestMarkers();

    // ~8 Hz is plenty for the mini-map's player dot.
    if (time - this.lastPosEmit > 120) {
      this.lastPosEmit = time;
      EventBus.emit(GameEvents.PLAYER_MOVED, { x: this.player.x, y: this.player.y });
    }

    if (this.dialogueOpen || this.overview) {
      // React or the map view owns the moment; freeze but keep rendering.
      this.player.setVelocity(0, 0);
      this.hint.setVisible(false);
      return;
    }

    this.updateNearestNpc();
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
      const linaHasSomethingToSay =
        this.quest === 'report' ||
        this.quest === 'expectation' ||
        this.quest === 'implement' ||
        this.quest === 'retry' ||
        (this.quest === 'announce' && this.announceComplete());
      if (npc.definition.followsPlayer && !linaHasSomethingToSay) continue;

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

    // The civic notice board joins the interaction round during the announce
    // stage - hanging the poster is part of telling the town.
    const boardDistance =
      this.quest === 'announce' && !this.posterHung
        ? Phaser.Math.Distance.Between(this.player.x, this.player.y, NOTICE_BOARD.x, NOTICE_BOARD.y)
        : Number.POSITIVE_INFINITY;
    const nearestBoard = boardDistance <= NOTICE_BOARD.radius && boardDistance < nearestDistance;

    if ((nearest || nearestBoard) && !this.dialogueOpen) {
      this.hint
        .setText(nearestBoard ? 'Duyuruyu hazırla (E)' : nearest!.definition.hint)
        .setPosition(
          nearestBoard ? NOTICE_BOARD.x : nearest!.sprite.x,
          nearestBoard
            ? NOTICE_BOARD.y - 50
            : nearest!.sprite.y - nearest!.sprite.displayHeight - 6,
        )
        .setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
        if (nearestBoard) this.openAnnouncement();
        else this.openDialogue(nearest!);
      }
    } else {
      this.hint.setVisible(false);
    }
  }

  /** The board opens the announcement composer instead of instant-hanging. */
  private openAnnouncement(): void {
    this.dialogueOpen = true;
    this.hint.setVisible(false);
    this.player.setVelocity(0, 0);
    this.stopWaddle();
    this.setIdleFrame();
    this.playDialogueCue();
    EventBus.emit(GameEvents.OPEN_ANNOUNCE);
  }

  /** React posted the town announcement - now it actually goes on the board. */
  private handleAnnounceSubmitted(payload: { icon: string; headline: string }): void {
    this.posterHung = true;
    this.dialogueOpen = false;
    this.hint.setVisible(false);
    this.playSlice(SoundKeys.TICK, 0, 600, 0.6);
    this.showToast(
      `${payload.icon} "${payload.headline}" — kasaba panosunda!`,
      NOTICE_BOARD.x,
      NOTICE_BOARD.y - 60,
    );
    if (this.announceComplete()) this.playSlice(SoundKeys.COMPLETE, 0, 1800, 0.6);
    this.refreshQuestMarkers();
    this.emitObjective();
  }

  /** Short murmur sting whenever an NPC conversation or card opens. */
  private playDialogueCue(): void {
    this.playSlice(SoundKeys.DIALOGUE, 0.4, 1600, 0.5);
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

    this.stepTimer -= this.game.loop.delta;
    if (this.stepTimer <= 0) {
      this.stepTimer = STEP_INTERVAL_MS;
      this.playStep();
    }

    if (!this.waddling) {
      this.waddling = true;
      this.idleTween?.pause();
    }
  }

  private stopWaddle(): void {
    if (!this.waddling) return;
    this.waddling = false;
    this.idleTween?.resume();
    this.player.setAngle(0).setScale(PLAYER_SCALE);
  }

  /** Direction -> walk-anim key on the active player sheet. */
  private animFor(facing: Facing): string {
    if (this.playerTexture === TextureKeys.LINA) return `lina-${facing}`;
    return this.dirAnimFor(facing);
  }

  private dirAnimFor(facing: Facing): PlayerAnimKey {
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
    // Both kid sheets share the same 3x4 layout - same idle frame indices.
    this.player.setFrame(PLAYER_ANIM_FRAMES[this.dirAnimFor(this.facing)].idle);
  }
}
