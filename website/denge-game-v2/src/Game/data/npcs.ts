/**
 * Interaction points.
 *
 * Seven NPCs cover the town's five districts via approach -> hint ->
 * E -> React dialogue -> resume. The original three keep decision choices;
 * the four investigation NPCs currently only offer introductory dialogue.
 * All use smooth 1x4 strips; frame 0 is the front/down pose.
 */

import { TextureKeys, type TextureKey } from './assets';
import type { DialogueChoice } from '../events/gameEvents';
import type { DistrictId } from './districts';
import type { InvestigationId } from './story';

export interface NpcDefinition {
  id: string;
  /** Display name shown in the dialogue card. */
  name: string;
  textureKey: TextureKey;
  /** Frame index on the strip: 0 = down, 1 = right, 2 = up, 3 = left. */
  frame: number;
  x: number;
  /** Base line, same convention as world objects. */
  y: number;
  /** Display scale - the strips are ~2x the player frame's native size. */
  scale: number;
  district: DistrictId;
  /** Radius in world pixels within which the interaction hint appears. */
  interactionRadius: number;
  hint: string;
  /** When set and the quest allows it, E opens the investigation card instead. */
  investigationId?: InvestigationId;
  /** Lina trails the player through town instead of standing still. */
  followsPlayer?: boolean;
  dialogue: {
    text: string;
    choices: DialogueChoice[];
  };
  /** Collision footprint in source pixels; the scene multiplies by `scale`. */
  collision: { width: number; height: number };
}

const CHOICES: DialogueChoice[] = [
  { id: 'repair-well', text: 'Eski kuyuyu onar' },
  { id: 'reduce-water', text: 'Su kullanimini azalt' },
  { id: 'ask-town', text: 'Kasaba halkiyla konus' },
];

export const NPCS: readonly NpcDefinition[] = [
  {
    id: 'elif-teyze',
    name: 'Elif Teyze',
    textureKey: TextureKeys.ELIF_TEYZE,
    frame: 0,
    x: 270,
    y: 730,
    scale: 0.075,
    district: 'agriculture',
    interactionRadius: 90,
    hint: 'E ile konus',
    dialogue: {
      text: 'Tarlalar kuruyor evladim, sulama suyu yetmiyor. Genc biri olarak sence ne yapmaliyiz?',
      choices: CHOICES,
    },
    collision: { width: 250, height: 20 },
  },
  {
    id: 'lina',
    name: 'Lina',
    textureKey: TextureKeys.LINA,
    frame: 1,
    x: 1080,
    y: 900,
    scale: 0.14,
    district: 'park',
    interactionRadius: 90,
    hint: 'E ile konus',
    followsPlayer: true,
    dialogue: {
      text: 'Cesmenin suyu bile azaldi, goruyor musun? Okulda da iki gundur su kesik. Sence kasaba ne yapmalı?',
      choices: CHOICES,
    },
    collision: { width: 26, height: 12 },
  },
  {
    id: 'mayor',
    name: 'Belediye Baskani',
    textureKey: TextureKeys.MAYOR,
    frame: 0,
    x: 820,
    y: 1310,
    scale: 0.52,
    district: 'municipality',
    interactionRadius: 90,
    hint: 'E ile konus',
    investigationId: 'belediye',
    dialogue: {
      text: 'Kasabanin su butcesi kritik seviyede. Karar vermeden once her kesimi dinlemeliyiz. Sen ne oneriyorsun?',
      choices: CHOICES,
    },
    collision: { width: 28, height: 14 },
  },
  {
    id: 'muhendis-aylin',
    name: 'Su Mühendisi Aylin',
    textureKey: TextureKeys.ENGINEER_AYLIN,
    frame: 0,
    x: 560,
    y: 345,
    scale: 0.12,
    district: 'reservoir',
    interactionRadius: 90,
    hint: 'E ile konus',
    investigationId: 'baraj',
    dialogue: {
      text: 'Son haftalarda rezervuar seviyesi düştü. Yağış az ama sorunun tek nedeni bu olmayabilir.',
      choices: [],
    },
    collision: { width: 160, height: 12 },
  },
  {
    id: 'ciftci-riza',
    name: 'Çiftçi Rıza',
    textureKey: TextureKeys.FARMER_RIZA,
    frame: 0,
    x: 410,
    y: 750,
    scale: 0.12,
    district: 'agriculture',
    interactionRadius: 90,
    hint: 'E ile konus',
    investigationId: 'tarim',
    dialogue: {
      text: 'Bu yıl hava daha sıcak. Ürünleri korumak için daha çok suluyoruz. Damla sulama suyu azaltır ama kurulumu pahalı.',
      choices: [],
    },
    collision: { width: 160, height: 12 },
  },
  {
    id: 'nuri-amca',
    name: 'Nuri Amca',
    textureKey: TextureKeys.NURI_AMCA,
    frame: 0,
    x: 1510,
    y: 850,
    scale: 0.13,
    district: 'residential',
    interactionRadius: 90,
    hint: 'E ile konus',
    investigationId: 'konut',
    dialogue: {
      text: 'Evlerde su basıncı azaldı. Sokakta bir sızıntı da var diyorlar; hep birlikte bakmak gerek.',
      choices: [],
    },
    collision: { width: 150, height: 12 },
  },
  {
    id: 'isci-kemal',
    name: 'Belediye Çalışanı Kemal',
    textureKey: TextureKeys.WORKER_KEMAL,
    frame: 0,
    x: 1170,
    y: 830,
    scale: 0.13,
    district: 'park',
    interactionRadius: 90,
    hint: 'E ile konus',
    investigationId: 'park',
    dialogue: {
      text: 'Parkı yeşil tutmak ve çeşmeyi çalıştırmak için de su kullanıyoruz. Sence hepsi aynı ölçüde gerekli mi?',
      choices: [],
    },
    collision: { width: 150, height: 12 },
  },
] as const;

/**
 * Short in-world acknowledgement of the player's decision.
 * The authoritative stat effects live in `./stats.ts`.
 */
export const DECISION_FEEDBACK: Record<string, string> = {
  'repair-well': 'Kuyunun onarilmasina karar verdin!',
  'reduce-water': 'Kasabada su tasarrufu baslatildi!',
  'ask-town': 'Kasaba halkiyla gorusmeye karar verdin!',
};
