/**
 * Kadim Uyum Haritası — the four-district system puzzle the mayor hands over
 * before the plan meeting (web port of Unity GameHUD.AncientPuzzle.cs).
 *
 * Maarif Modeli: sistem okuryazarlığı — the dam, the network, the fields and
 * the park are one system; cutting one part changes the others.
 *
 * Pure data: the component (components/workshop/KadimPuzzle.tsx) owns state.
 */
import type { InvestigationId } from './story';

export type KadimSlot = 'nw' | 'ne' | 'sw' | 'se';
export type KadimPieceId = 'baraj' | 'konut' | 'tarla' | 'park';
/** Edge directions in clockwise order — rotating by r shifts the index by r. */
export type KadimDir = 'top' | 'right' | 'bottom' | 'left';
export const KADIM_DIRS: readonly KadimDir[] = ['top', 'right', 'bottom', 'left'];

export interface KadimPiece {
  id: KadimPieceId;
  /** Workshop whose completion earns this engraving stone. */
  cardId: InvestigationId;
  /** Where it belongs; also which quadrant of kadim-map.webp it shows. */
  home: KadimSlot;
  label: string;
  guardian: string;
  icon: string;
  /** One line of what the student learned in that workshop. */
  learned: string;
  /** Channel ends at rotation 0 (the solved orientation). */
  channels: readonly KadimDir[];
}

/**
 * Water network: the dam (nw, fed from the reservoir above) feeds the homes
 * (ne) and the fields (sw); the homes' mains go on to the park (se). Each
 * channel set is unique to rotation 0, so "water reaches all four" == solved.
 */
export const KADIM_PIECES: readonly KadimPiece[] = [
  {
    id: 'baraj',
    cardId: 'baraj',
    home: 'nw',
    label: 'Baraj',
    guardian: 'Mühendis Aylin',
    icon: '💧',
    learned: 'Barajdan çıkan her 80 litrenin 20’si yolda kayboluyor.',
    channels: ['top', 'right', 'bottom'],
  },
  {
    id: 'konut',
    cardId: 'konut',
    home: 'ne',
    label: 'Konut Şebekesi',
    guardian: 'Nuri Amca',
    icon: '🏠',
    learned: 'Görünmeyen bir kaçak bile kasabanın suyunu sessizce tüketir.',
    channels: ['left', 'bottom'],
  },
  {
    id: 'tarla',
    cardId: 'tarim',
    home: 'sw',
    label: 'Tarla',
    guardian: 'Çiftçi Rıza',
    icon: '🌾',
    learned: 'Damla sulama suyu köke, doğru basınçla ve israfsız ulaştırır.',
    channels: ['top'],
  },
  {
    id: 'park',
    cardId: 'park',
    home: 'se',
    label: 'Park ve Meydan',
    guardian: 'İşçi Kemal',
    icon: '🌳',
    learned: 'Doğru yön ve sabah sulaması parkı az suyla yeşil tutar.',
    channels: ['top'],
  },
];

export const KADIM_SLOTS: readonly { id: KadimSlot; compass: string; clue: string }[] = [
  { id: 'nw', compass: '↖ Kuzey-Batı', clue: 'Suyun doğduğu yer' },
  { id: 'ne', compass: '↗ Kuzey-Doğu', clue: 'Suyun borularla evlere ulaştığı yer' },
  { id: 'sw', compass: '↙ Güney-Batı', clue: 'Toprağın su içtiği yer' },
  { id: 'se', compass: '↘ Güney-Doğu', clue: 'Kasabanın nefes aldığı yeşil meydan' },
];

/** Grid position of each slot (column, row). */
export const SLOT_POS: Record<KadimSlot, [number, number]> = {
  nw: [0, 0],
  ne: [1, 0],
  sw: [0, 1],
  se: [1, 1],
};

/** Starting rotations for the connect phase — every piece needs turning. */
export const KADIM_SCRAMBLE: Record<KadimPieceId, number> = {
  baraj: 2,
  konut: 1,
  tarla: 3,
  park: 2,
};

export const pieceAt = (slot: KadimSlot) => KADIM_PIECES.find((p) => p.home === slot)!;

/** Channel directions of a piece after `rotation` quarter turns clockwise. */
export function rotatedChannels(piece: KadimPiece, rotation: number): KadimDir[] {
  return piece.channels.map((d) => KADIM_DIRS[(KADIM_DIRS.indexOf(d) + rotation) % 4]);
}

const OPPOSITE: Record<KadimDir, KadimDir> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const STEP: Record<KadimDir, [number, number]> = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };

/**
 * Which pieces water reaches, given every piece sits on its home slot.
 * Water enters the dam stone from the reservoir above (its top edge).
 */
export function wetPieces(rotations: Record<KadimPieceId, number>): Set<KadimPieceId> {
  const bySlot = new Map<string, KadimPiece>();
  for (const piece of KADIM_PIECES) bySlot.set(SLOT_POS[piece.home].join(','), piece);
  const wet = new Set<KadimPieceId>();
  const source = pieceAt('nw');
  if (!rotatedChannels(source, rotations[source.id]).includes('top')) return wet;
  const queue: KadimPiece[] = [source];
  wet.add(source.id);
  while (queue.length) {
    const piece = queue.shift()!;
    const [x, y] = SLOT_POS[piece.home];
    for (const dir of rotatedChannels(piece, rotations[piece.id])) {
      const [dx, dy] = STEP[dir];
      const next = bySlot.get(`${x + dx},${y + dy}`);
      if (!next || wet.has(next.id)) continue;
      if (rotatedChannels(next, rotations[next.id]).includes(OPPOSITE[dir])) {
        wet.add(next.id);
        queue.push(next);
      }
    }
  }
  return wet;
}

export interface KadimPrediction {
  id: KadimPieceId;
  label: string;
  correct: boolean;
  feedback: string;
}

/** "Baraj %20'ye düşerse önce nereyi korumalıyız?" — no penalty, only reasons. */
export const KADIM_PREDICTIONS: readonly KadimPrediction[] = [
  {
    id: 'konut',
    label: '🏠 Evlerin içme suyu',
    correct: true,
    feedback:
      'Güzel düşündün! Kuraklıkta önce içme ve kullanma suyu korunur: evler, okul ve sağlık ocağı susuz kalamaz. Tarlayı damla sulamayla, parkı sabah sulamasıyla az suyla yaşatırız.',
  },
  {
    id: 'tarla',
    label: '🌾 Tarlaların sulaması',
    correct: false,
    feedback:
      'Tarla çok önemli, sofralarımız oradan geliyor. Ama kuraklıkta önce içme suyu korunur. Tarlayı Rıza’nın damla sulamasıyla daha az suyla yaşatabiliriz.',
  },
  {
    id: 'park',
    label: '🌳 Parkın fıskiyeleri',
    correct: false,
    feedback:
      'Park kasabanın nefesi, ama kuraklıkta fıskiyeler ilk kısılabilecek kullanım. Önce içme suyu korunur; parkı Kemal’in sabah sulamasıyla az suyla yeşil tutarız.',
  },
];

export const KADIM_IDLE_HINT_MS = 45_000;
export const KADIM_TITLE = 'Kadim Kasaba Kâşifi';
