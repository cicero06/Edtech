/**
 * Metin bankası — every sentence the town says about numbers or results.
 *
 * Rules (enforced by tools/check-scenarios.mjs and again at runtime):
 * - Template text carries NO digits; numbers only enter through {slots}
 *   filled from the model, so a number can't drift from the cause it reports.
 * - Numbers sit before a unit (L/dk, puan) or after '%', so Turkish suffixes
 *   attach to the unit, never to the number ("80 L/dk'sı").
 * - Every branch has a `when`; if no branch holds, the sentence is NOT said.
 * - CLAIMS lists what phrases assert ("kaçak kapandı" ⇒ leak fixed). A
 *   rendered sentence whose claim is false for this outcome is dropped.
 *
 * Phrasings were written with AI assistance and are reviewed by the team on
 * the scenario preview page before release.
 */
import { facts, type Outcome, type ScenarioFacts, type ScenarioParams, type SolutionId } from './model';

export interface TextContext {
  f: ScenarioFacts;
  o?: Outcome;
  /** Picks one of the equivalent phrasings — stable per student. */
  seed: string;
}

interface Branch {
  when: (c: TextContext) => boolean;
  lines: readonly string[];
}

interface Beat {
  /** Values the templates may use; numbers are rounded here, once. */
  slots: (c: TextContext) => Record<string, string | number>;
  branches: readonly Branch[];
}

const always = () => true;
const picked = (c: TextContext, id: SolutionId) => !!c.o?.picks.includes(id);

/** How each measure is named when it is the biggest contributor. */
export const CONTRIBUTOR_LABEL: Record<SolutionId, string> = {
  'repair-pipes': 'kapanan boru kaçakları',
  'rain-harvest': 'yağmur suyu depoları',
  'drip-irrigation': 'tarlalardaki damla sulama',
  'fountains-off': 'kapatılan fıskiyeler',
  'saving-campaign': 'evlerdeki tasarruf',
};

const factSlots = (c: TextContext) => ({
  outflow: c.f.outflowL,
  leak: c.f.leakL,
  leakPct: c.f.leakPct,
  homes: c.f.homesL,
  park: c.f.parkL,
  delivered: c.f.deliveredL,
  farm: c.f.farmL,
  today: c.f.history.today,
  spring: c.f.history.spring,
  winter: c.f.history.winter,
  lastYear: c.f.history.lastYear,
  d1: c.f.drops[0],
  d2: c.f.drops[1],
  d3: c.f.drops[2],
  rainDeficit: c.f.rainDeficitPct,
  evaporation: c.f.evaporationPct,
  critical: c.f.criticalPct,
});

const outcomeSlots = (c: TextContext) => {
  const o = c.o!;
  return {
    ...factSlots(c),
    before: o.reservoirBefore,
    after: o.reservoirAfter,
    mid: o.reservoirMid,
    noPlan: o.reservoirNoPlan,
    gain: Math.abs(o.deltaPts),
    top: o.topContributor ? CONTRIBUTOR_LABEL[o.topContributor] : '',
    leakAfter: o.leakAfterL,
    repaired: Math.round(o.savedL['repair-pipes'] ?? 0),
    homesSaved: o.homesSavingL,
    parkAfter: o.parkAfterL,
    farmAfter: o.farmAfterL,
  };
};

const up = (c: TextContext) => !!c.o && c.o.deltaPts > 0;
const flat = (c: TextContext) => !!c.o && c.o.deltaPts === 0;
const down = (c: TextContext) => !!c.o && c.o.deltaPts < 0;
const slowed = (c: TextContext) => !!c.o && c.o.reservoirAfter > c.o.reservoirNoPlan;

export const BEATS = {
  // ---- chapter 1: district evidence --------------------------------------
  'baraj.hint': {
    slots: factSlots,
    branches: [
      {
        when: always,
        lines: [
          'Barajdan çıkan {outflow} L/dk suyun {leak} L/dk’sı yeraltı boru sızıntısında kayboluyor.',
          'Barajdan dakikada {outflow} L çıkıyor; bunun {leak} L’si yeraltındaki bir sızıntıda kayboluyor.',
        ],
      },
    ],
  },
  'baraj.datum': {
    slots: factSlots,
    branches: [{ when: always, lines: ['Baraj çıkışı: {outflow} L/dk'] }],
  },
  'baraj.explanation': {
    slots: factSlots,
    branches: [
      {
        when: always,
        lines: [
          'Bahar’dan bugüne {spring} → {today}: tam {d3} puan düşmüş; önceki dönemler {d1} ve {d2} puandı. Düşüş yavaşlamıyor, hızlanıyor!',
        ],
      },
    ],
  },
  'konut.datum': {
    slots: factSlots,
    branches: [{ when: always, lines: ['Konut ölçümü: {homes} L/dk (basınç düşük)'] }],
  },
  'park.datum': {
    slots: factSlots,
    branches: [{ when: always, lines: ['Park ölçümü: {park} L/dk (ıslak zemin)'] }],
  },

  // ---- chapter 2: mid-month twist (repair crews) -------------------------
  'twist.repair': {
    slots: outcomeSlots,
    branches: [
      {
        when: (c) => picked(c, 'repair-pipes') && up(c),
        lines: [
          'Kaçakların neredeyse tamamı kapandı, bu iyi haber. Aylin rezervin toparlanmaya başladığını ama kuraklık sürdüğü için yavaş ilerlediğini söylüyor.',
        ],
      },
      {
        when: (c) => picked(c, 'repair-pipes') && !up(c),
        lines: [
          'Kaçakların neredeyse tamamı kapandı, bu iyi haber. Ama kuraklık sürüyor; Aylin rezervin hâlâ baskı altında olduğunu söylüyor.',
        ],
      },
    ],
  },

  // ---- chapter 2: day-30 review — Aylin (reservoir) ----------------------
  'aylin.review': {
    slots: outcomeSlots,
    branches: [
      {
        when: up,
        lines: [
          'Yeni ölçümleri getirdim: rezerv seviyesi plan öncesi %{before}, bugün %{after}. Tam {gain} puan yükseldi! En büyük katkı {top} oldu.',
          'Ölçümler geldi: rezerv %{before} seviyesinden %{after} seviyesine çıktı, {gain} puanlık bir toparlanma. Bunda en çok {top} işe yaradı.',
        ],
      },
      {
        when: flat,
        lines: [
          'Rezerv bir ay önceki gibi %{after} seviyesinde, yani sabit kaldı. Kuraklık sürerken düşüşü durdurduk ama toparlanma için daha fazlası gerekiyor.',
        ],
      },
      {
        when: (c) => down(c) && slowed(c),
        lines: [
          'Kuraklık sürüyor: rezerv %{before} seviyesinden %{after} seviyesine düştü. Ama planımız düşüşü yavaşlattı; plan olmasaydı %{noPlan} seviyesinde olacaktık. En çok {top} yardım etti.',
        ],
      },
      {
        when: (c) => down(c) && !slowed(c),
        lines: [
          'Rezerv %{before} seviyesinden %{after} seviyesine düştü. Kuraklık sürerken planın rezerve belirgin bir katkısı görünmüyor; sistemsel bir adım gerekiyor.',
        ],
      },
    ],
  },
  'aylin.rainNote': {
    slots: outcomeSlots,
    branches: [
      {
        when: (c) => picked(c, 'rain-harvest'),
        lines: ['Depolar şimdilik yarım dolu; yağmurlu aylarda katkıları daha da artacak.'],
      },
    ],
  },
  'aylin.finding': {
    slots: outcomeSlots,
    branches: [
      { when: up, lines: ['Rezerv yükseldi; en büyük katkı {top}.'] },
      { when: flat, lines: ['Rezerv sabit kaldı; toparlanma için daha fazlası gerekiyor.'] },
      { when: (c) => down(c) && slowed(c), lines: ['Rezerv düştü ama plan düşüşü yavaşlattı.'] },
      { when: (c) => down(c) && !slowed(c), lines: ['Rezerv düşmeye devam ediyor.'] },
    ],
  },
  'aylin.datum': {
    slots: outcomeSlots,
    branches: [{ when: (c) => !!c.o, lines: ['Seviye: %{before} → %{after}'] }],
  },

  // ---- Rıza (fields) ------------------------------------------------------
  'riza.review': {
    slots: outcomeSlots,
    branches: [
      {
        when: (c) => picked(c, 'drip-irrigation'),
        lines: [
          'Damla sulama çalışıyor evladım! Tarlaya giden su dakikada {farm} L yerine {farmAfter} L, ürünler de zarar görmedi. Yalnız sistemi doğru kullanmak için biraz eğitim lazım, yanlış ayarlayanlar var.',
        ],
      },
      {
        when: (c) => !picked(c, 'drip-irrigation'),
        lines: [
          'Tarlalar için doğrudan bir destek çıkmadı plandan. Vargel sulamaya devam ediyoruz, tarlaya hâlâ dakikada {farm} L gidiyor ve su yine yetmiyor.',
        ],
      },
    ],
  },
  'riza.finding': {
    slots: outcomeSlots,
    branches: [
      { when: (c) => picked(c, 'drip-irrigation'), lines: ['Damla sulama işe yaradı; kullanım eğitimi gerekiyor.'] },
      { when: (c) => !picked(c, 'drip-irrigation'), lines: ['Tarlalarda su sıkıntısı sürüyor.'] },
    ],
  },
  'riza.datum': {
    slots: outcomeSlots,
    branches: [
      { when: (c) => picked(c, 'drip-irrigation'), lines: ['Tarla suyu: {farm} → {farmAfter} L/dk'] },
      { when: (c) => !picked(c, 'drip-irrigation'), lines: ['Tarla suyu: {farm} L/dk (vargel)'] },
    ],
  },

  // ---- Nuri (homes & leak) ------------------------------------------------
  'nuri.review': {
    slots: outcomeSlots,
    branches: [
      {
        when: (c) => picked(c, 'repair-pipes') && picked(c, 'saving-campaign'),
        lines: [
          'Kaçağın neredeyse tamamı kapandı, musluklardaki basınç düzeldi! Sokakta dakikada {repaired} L boşa akan su artık evlere geliyor, mahalle de tasarrufa alıştı. Çalışma sırasında iki gün su kesildi ama değdi.',
        ],
      },
      {
        when: (c) => picked(c, 'repair-pipes') && !picked(c, 'saving-campaign'),
        lines: [
          'Kaçağın neredeyse tamamı kapandı, musluklardaki basınç düzeldi! Sokakta dakikada {repaired} L boşa akan su artık evlere geliyor. Çalışma sırasında iki gün su kesildi, biraz zorlandık ama değdi. Kırk yılda bir ilk!',
        ],
      },
      {
        when: (c) => !picked(c, 'repair-pipes') && picked(c, 'saving-campaign'),
        lines: [
          'Mahallede herkes musluğunu kısıyor, evler dakikada {homesSaved} L daha az su çekiyor. Ama sokaktaki kaçak hâlâ akıyor evladım: dakikada {leak} L, gözüm hep orada.',
        ],
      },
      {
        when: (c) => !picked(c, 'repair-pipes') && !picked(c, 'saving-campaign'),
        lines: [
          'Basınç hâlâ düşük, kaçak da akıyor: dakikada {leak} L boşa gidiyor. Bekliyoruz ama mahallede sabır azalıyor, onu da söyleyeyim.',
        ],
      },
    ],
  },
  'nuri.finding': {
    slots: outcomeSlots,
    branches: [
      { when: (c) => picked(c, 'repair-pipes'), lines: ['Kaçağın neredeyse tamamı kapandı, basınç düzeldi; geçici kesinti zorladı.'] },
      {
        when: (c) => !picked(c, 'repair-pipes') && picked(c, 'saving-campaign'),
        lines: ['Evlerde tasarruf arttı; sokak kaçağı sürüyor.'],
      },
      {
        when: (c) => !picked(c, 'repair-pipes') && !picked(c, 'saving-campaign'),
        lines: ['Evlerde sorun devam ediyor.'],
      },
    ],
  },
  'nuri.datum': {
    slots: outcomeSlots,
    branches: [
      { when: (c) => picked(c, 'repair-pipes'), lines: ['Kaçak: {leak} → {leakAfter} L/dk'] },
      { when: (c) => !picked(c, 'repair-pipes'), lines: ['Kaçak: {leak} L/dk (aktif)'] },
    ],
  },

  // ---- Kemal (park) -------------------------------------------------------
  'kemal.review': {
    slots: outcomeSlots,
    branches: [
      {
        when: (c) => picked(c, 'rain-harvest'),
        lines: [
          'Depo suyuyla parkı suluyorum artık, ağaçlar rahatladı! Park şebekeden dakikada {park} L yerine {parkAfter} L çekiyor. Bu iş tuttu!',
        ],
      },
      {
        when: (c) => !picked(c, 'rain-harvest') && picked(c, 'fountains-off'),
        lines: [
          'Fıskiyeler kapalı, park dakikada {park} L yerine {parkAfter} L çekiyor; tasarruf gerçek. Ama ağaçların günlük ihtiyacı sürüyor, parkı idareli sulamaya devam edeceğiz.',
        ],
      },
      {
        when: (c) => !picked(c, 'rain-harvest') && !picked(c, 'fountains-off'),
        lines: [
          'Parkı hâlâ şebekeden suluyoruz, dakikada {park} L gidiyor; başka kaynak yok. Kuraklık sürerse yeşili korumak zorlaşacak.',
        ],
      },
    ],
  },
  'kemal.finding': {
    slots: outcomeSlots,
    branches: [
      { when: (c) => picked(c, 'rain-harvest'), lines: ['Park depo suyuyla sulanıyor.'] },
      {
        when: (c) => !picked(c, 'rain-harvest') && picked(c, 'fountains-off'),
        lines: ['Fıskiyeler kapandı; ağaçların su ihtiyacı sürüyor.'],
      },
      {
        when: (c) => !picked(c, 'rain-harvest') && !picked(c, 'fountains-off'),
        lines: ['Park hâlâ şebeke suyuyla sulanıyor.'],
      },
    ],
  },
  'kemal.datum': {
    slots: outcomeSlots,
    branches: [{ when: (c) => !!c.o, lines: ['Park çekişi: {park} → {parkAfter} L/dk'] }],
  },
} as const satisfies Record<string, Beat>;

export type BeatId = keyof typeof BEATS;

/**
 * What phrases assert. If a rendered sentence matches a pattern whose
 * predicate is false for this outcome, the sentence is not said.
 */
export const CLAIMS: readonly { pattern: RegExp; holds: (c: TextContext) => boolean; label: string }[] = [
  { label: 'kaçak kapandı', pattern: /kaça(k|ğın)[^.!]*kapandı|kaçaklar(ın)?[^.!]*kapandı/i, holds: (c) => !!c.o?.leakFixed },
  { label: 'kaçak sürüyor', pattern: /kaçak (hâlâ|da) akıyor|kaçağı sürüyor/i, holds: (c) => !!c.o && !c.o.leakFixed },
  { label: 'basınç düzeldi', pattern: /basınç düzeldi/i, holds: (c) => c.o?.pressure === 'normal' },
  { label: 'basınç düşük', pattern: /basınç hâlâ düşük/i, holds: (c) => c.o?.pressure === 'low' },
  {
    label: 'rezerv yükseldi',
    pattern: /yükseldi|seviyesine çıktı|toparlanmaya başla|puanlık bir toparlanma/i,
    holds: (c) => !!c.o && c.o.deltaPts > 0,
  },
  { label: 'rezerv düştü', pattern: /seviyesine düştü|Rezerv düştü|düşmeye devam/i, holds: (c) => !!c.o && c.o.deltaPts < 0 },
  { label: 'rezerv sabit', pattern: /sabit kaldı/i, holds: (c) => !!c.o && c.o.deltaPts === 0 },
  { label: 'plan yavaşlattı', pattern: /yavaşlattı/i, holds: (c) => !!c.o && c.o.reservoirAfter > c.o.reservoirNoPlan },
  { label: 'park depodan', pattern: /depo suyuyla/i, holds: (c) => c.o?.parkSource === 'depo' },
  { label: 'fıskiyeler kapalı', pattern: /fıskiyeler kapa(lı|ndı)/i, holds: (c) => !!c.o?.picks.includes('fountains-off') },
  { label: 'damla çalışıyor', pattern: /damla sulama (çalışıyor|işe yaradı)/i, holds: (c) => c.o?.farmState === 'verimli' },
  { label: 'tarla susuz', pattern: /su yine yetmiyor|su sıkıntısı sürüyor/i, holds: (c) => c.o?.farmState === 'zor' },
  { label: 'kesinti', pattern: /iki gün su kesildi/i, holds: (c) => c.o?.interruptionDays === 2 },
  { label: 'ev tasarrufu', pattern: /tasarruf arttı|tasarrufa alıştı|daha az su çekiyor/i, holds: (c) => (c.o?.homesSavingL ?? 0) > 0 },
];

function hashPick(seed: string, beat: string, n: number): number {
  let h = 0x811c9dc5;
  const text = `${seed}|${beat}`;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % n;
}

export function fill(template: string, slots: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in slots ? String(slots[key]) : match,
  );
}

/** Claims in `text` that are false for this context (empty = consistent). */
export function falseClaims(text: string, c: TextContext): string[] {
  return CLAIMS.filter((claim) => claim.pattern.test(text) && !claim.holds(c)).map((claim) => claim.label);
}

/**
 * The sentence for a beat, or null when no branch holds or the rendered text
 * would assert something the model did not produce — then it is not said.
 */
export function say(beat: BeatId, c: TextContext): string | null {
  const def: Beat = BEATS[beat];
  const branch = def.branches.find((b) => b.when(c));
  if (!branch) return null;
  const line = branch.lines[hashPick(c.seed, beat, branch.lines.length)];
  const text = fill(line, def.slots(c));
  if (/\{\w+\}/.test(text) || falseClaims(text, c).length) return null;
  return text;
}

/** Convenience: context straight from params (+ optional plan outcome). */
export function context(params: ScenarioParams, seed: string, o?: Outcome): TextContext {
  return { f: facts(params), o, seed };
}
