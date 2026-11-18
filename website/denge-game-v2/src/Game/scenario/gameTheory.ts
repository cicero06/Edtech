/**
 * Oyun Teorisi & Nash Dengesi Motoru (Game Theory & Nash Bargaining Engine).
 *
 * Denge Kasabası'ndaki su krizi, ortak havuz kaynağı (Common-Pool Resource)
 * ve sınırlı bütçe (₺1.000.000) altında 4 paydaş komisyonun katıldığı çok
 * oyunculu bir işbirlikçi oyun teorisi (Nash Bargaining Game) problemidir:
 *
 *   1. Su ve Altyapı Güvenliği (Hakan Bey / SUKİ)
 *   2. Konut ve Sosyal Refah (Leyla Hanım / Mahalle)
 *   3. Tarım ve Gıda Üretimi (Zeynep Hanım / Kırsal)
 *   4. Mali Disiplin ve Kamusal Ekosistem (Selim Bey / Bütçe & Park)
 *
 * Her olası çözüm paketi s ⊆ SOLUTIONS için:
 *   - 4 paydaşın fayda vektörü U(s) = (u_water, u_social, u_agri, u_fiscal) [0..100]
 *   - İşbirliksiz anlaşmazlık noktası (Disagreement Point) d = (d_1, d_2, d_3, d_4)
 *   - Nash Uzlaşma Çarpımı: N(s) = ∏ max(1, u_i(s) - d_i)
 *   - Pareto Verimliliği (bütçe dahilinde hiçbir paydaşı kötüleştirmeden
 *     başka bir paydaşı iyileştiren başka bir paket var mı?)
 *   - Fırsat Maliyeti & Feragat (Opportunity Cost / Trade-off): Seçilmeyen en
 *     yüksek getirili alternatiften vazgeçilen su (L/dk) ve paydaş etkisi.
 */

import { SOLUTION_BUDGET, SOLUTION_CARDS } from '../data/story';
import { facts, simulate, SOLUTION_IDS, type ScenarioParams, type SolutionId } from './model';

export interface StakeholderPayoffs {
  /** SUKİ / Altyapı ve Baraj Rezerv Güvenliği (0..100) */
  water: number;
  /** Sosyal İşler / Hane İçme Suyu ve Basınç (0..100) */
  social: number;
  /** Tarım ve Ekosistem Sürdürülebilirliği (0..100) */
  ecology: number;
  /** Bütçe Verimliliği ve Kamusal Denge (0..100) */
  fiscal: number;
}

export interface OpportunityCostItem {
  solutionId: SolutionId;
  title: string;
  cost: number;
  forgoneWaterL: number;
  affectedStakeholder: string;
  description: string;
}

export interface GameTheoryAnalysis {
  pickedIds: SolutionId[];
  totalCost: number;
  payoffs: StakeholderPayoffs;
  /** Normalized Nash Bargaining Equilibrium index (0..100, where 100 is the scenario's Nash optimum). */
  nashScore: number;
  /** The budget-feasible package that maximizes the Nash product in this student's scenario. */
  nashOptimalIds: SolutionId[];
  /** True if no other budget-feasible package dominates this one across all 4 stakeholders. */
  isParetoOptimal: boolean;
  /** If not Pareto optimal, a dominating or higher-equilibrium package hint. */
  paretoImprovementHint: string | null;
  /** Equilibrium classification label for UI & reports. */
  equilibriumStatus: 'NASH_OPTIMAL' | 'PARETO_ETKIN' | 'TEK_TARAF_AGIRLIKLI' | 'DENGESIZ';
  equilibriumLabel: string;
  /** Explicit trade-offs / sacrifices made by choosing this package. */
  sacrifices: OpportunityCostItem[];
  /** Summary sentence explaining the game-theoretic trade-off. */
  summaryText: string;
}

const COST_MAP: Record<SolutionId, number> = Object.fromEntries(
  SOLUTION_CARDS.map((c) => [c.id, c.cost]),
) as Record<SolutionId, number>;

const TITLE_MAP: Record<SolutionId, string> = Object.fromEntries(
  SOLUTION_CARDS.map((c) => [c.id, c.title]),
) as Record<SolutionId, string>;

const STAKEHOLDER_FOR_SOLUTION: Record<SolutionId, string> = {
  'repair-pipes': 'SUKİ Altyapı & Konut Basıncı',
  'drip-irrigation': 'Tarım Vadisi & Gıda Üretimi',
  'rain-harvest': 'Park & Yeşil Alan Yedek Su',
  'saving-campaign': 'Hanehalkı Su Bilinci',
  'fountains-off': 'Merkez Park Görsel Estetiği',
};

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Computes the 4-stakeholder payoff vector U(s) for a given solution package
 * in the student's specific scenario (`params`).
 */
export function computePayoffs(
  params: ScenarioParams,
  picks: readonly string[],
): StakeholderPayoffs {
  const f = facts(params);
  const o = simulate(params, picks);
  const has = (id: SolutionId) => picks.includes(id);

  const spent = picks.reduce(
    (sum, id) => sum + (COST_MAP[id as SolutionId] ?? 0),
    0,
  );
  const totalSavedL = Object.values(o.savedL).reduce((s, v) => s + (v ?? 0), 0);

  // 1. Water & Infrastructure Security (Hakan Bey / SUKİ):
  // Driven by reservoir margin above critical threshold and leak reduction.
  const marginPts = o.reservoirAfter - f.criticalPct;
  const leakReductionRatio = f.leakL > 0 ? (f.leakL - o.leakAfterL) / f.leakL : 0;
  const water = clamp100(32 + marginPts * 2.4 + leakReductionRatio * 34);

  // 2. Social & Household Welfare (Leyla Hanım):
  // Driven by restoring street pressure (fixing pipe leak), household conservation support,
  // minus mild dissatisfaction if park fountains are shut without rain tanks.
  const pressureGain = has('repair-pipes') ? 38 : 0;
  const campaignGain = has('saving-campaign') ? 20 : 0;
  const fountainPenalty = has('fountains-off') && !has('rain-harvest') ? -6 : 4;
  const reservoirSafety = o.reservoirAfter >= o.reservoirBefore ? 12 : 0;
  const social = clamp100(34 + pressureGain + campaignGain + fountainPenalty + reservoirSafety);

  // 3. Agriculture & Ecology (Zeynep Hanım):
  // Driven by drip irrigation adoption (protecting crops against evaporation) and park water sustainability.
  const dripGain = has('drip-irrigation') ? 44 : 0;
  const rainGain = has('rain-harvest') ? 22 : 0;
  const parkSaveGain = has('fountains-off') ? 8 : 0;
  const ecology = clamp100(28 + dripGain + rainGain + parkSaveGain);

  // 4. Fiscal Efficiency & Cost-Benefit (Selim Bey):
  // Driven by litres saved per 100k TL spent + keeping emergency budget reserve.
  const remainingRatio = Math.max(0, (SOLUTION_BUDGET - spent) / SOLUTION_BUDGET);
  const costEfficiency =
    spent > 0 ? Math.min(48, (totalSavedL / (spent / 100_000)) * 3.8) : 15;
  const fiscal = clamp100(26 + costEfficiency + remainingRatio * 30);

  return { water, social, ecology, fiscal };
}

/**
 * Nash Bargaining Product relative to the non-cooperative disagreement baseline.
 */
function rawNashProduct(payoffs: StakeholderPayoffs, baseline: StakeholderPayoffs): number {
  const dw = Math.max(4, payoffs.water - baseline.water + 15);
  const ds = Math.max(4, payoffs.social - baseline.social + 15);
  const de = Math.max(4, payoffs.ecology - baseline.ecology + 15);
  const df = Math.max(4, payoffs.fiscal - baseline.fiscal + 15);
  return dw * ds * de * df;
}

/** Returns true if package B dominates package A (all payoffs >= and at least one >). */
function dominates(b: StakeholderPayoffs, a: StakeholderPayoffs): boolean {
  const geAll =
    b.water >= a.water &&
    b.social >= a.social &&
    b.ecology >= a.ecology &&
    b.fiscal >= a.fiscal;
  const gtOne =
    b.water > a.water ||
    b.social > a.social ||
    b.ecology > a.ecology ||
    b.fiscal > a.fiscal;
  return geAll && gtOne;
}

/** Enumerate all budget-feasible non-empty packages. */
function allFeasiblePackages(): SolutionId[][] {
  const result: SolutionId[][] = [];
  const n = SOLUTION_IDS.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    const combo: SolutionId[] = [];
    let cost = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        const id = SOLUTION_IDS[i];
        combo.push(id);
        cost += COST_MAP[id];
      }
    }
    if (cost <= SOLUTION_BUDGET) {
      result.push(combo);
    }
  }
  return result;
}

const FEASIBLE_PACKAGES = allFeasiblePackages();

export function analyzeGameTheory(
  params: ScenarioParams,
  rawPicks: readonly string[],
): GameTheoryAnalysis {
  const pickedIds = rawPicks.filter((id): id is SolutionId =>
    (SOLUTION_IDS as readonly string[]).includes(id),
  );
  const totalCost = pickedIds.reduce((s, id) => s + COST_MAP[id], 0);
  const baseline = computePayoffs(params, []);
  const currentPayoffs = computePayoffs(params, pickedIds);
  const currentNashRaw = rawNashProduct(currentPayoffs, baseline);

  // Evaluate all feasible packages to find the Nash Bargaining Optimum and Pareto frontier
  let bestNashRaw = 1;
  let bestNashCombo: SolutionId[] = FEASIBLE_PACKAGES[0];
  let dominatedBy: { combo: SolutionId[]; payoffs: StakeholderPayoffs } | null = null;

  for (const combo of FEASIBLE_PACKAGES) {
    const p = computePayoffs(params, combo);
    const nash = rawNashProduct(p, baseline);
    if (nash > bestNashRaw) {
      bestNashRaw = nash;
      bestNashCombo = combo;
    }
    if (pickedIds.length > 0 && !dominatedBy && dominates(p, currentPayoffs)) {
      dominatedBy = { combo, payoffs: p };
    }
  }

  // Normalized Nash Equilibrium score (0..100) using fourth-root scaling (geometric mean)
  const nashScore =
    pickedIds.length === 0
      ? 0
      : clamp100(Math.pow(currentNashRaw / bestNashRaw, 0.25) * 100);

  const isParetoOptimal = pickedIds.length > 0 && dominatedBy === null;

  // Opportunity cost: which unpicked solutions had significant water savings?
  const fullSim = simulate(params, SOLUTION_IDS);
  const sacrifices: OpportunityCostItem[] = SOLUTION_IDS.filter(
    (id) => !pickedIds.includes(id),
  )
    .map((id) => {
      const forgoneL = Math.round(fullSim.savedL[id] ?? 0);
      return {
        solutionId: id,
        title: TITLE_MAP[id],
        cost: COST_MAP[id],
        forgoneWaterL: forgoneL,
        affectedStakeholder: STAKEHOLDER_FOR_SOLUTION[id],
        description:
          id === 'fountains-off'
            ? 'Park fıskiyeleri açık bırakıldı (görsel estetik korundu, su tasarrufundan feragat edildi).'
            : `${TITLE_MAP[id]} seçilmeyerek ₺${COST_MAP[id].toLocaleString('tr-TR')} bütçe başka önceliklere ayrıldı (${forgoneL} L/dk potansiyel su katkısından feragat edildi).`,
      };
    })
    .sort((a, b) => b.forgoneWaterL - a.forgoneWaterL);

  let equilibriumStatus: GameTheoryAnalysis['equilibriumStatus'] = 'DENGESIZ';
  let equilibriumLabel = 'Henüz Paket Seçilmedi';

  if (pickedIds.length > 0) {
    const minAxis = Math.min(
      currentPayoffs.water,
      currentPayoffs.social,
      currentPayoffs.ecology,
      currentPayoffs.fiscal,
    );
    if (nashScore >= 92 && isParetoOptimal) {
      equilibriumStatus = 'NASH_OPTIMAL';
      equilibriumLabel = '⚖️ Nash Uzlaşma Dengesi (Tüm Paydaşlar Kazanıyor)';
    } else if (isParetoOptimal && minAxis >= 52) {
      equilibriumStatus = 'PARETO_ETKIN';
      equilibriumLabel = '✓ Pareto Etkin Denge (Güçlü Ödünleşme)';
    } else if (minAxis < 48) {
      equilibriumStatus = 'TEK_TARAF_AGIRLIKLI';
      equilibriumLabel = '⚠️ Asimetrik Karar (Bazı Paydaşlar Yüksek Feragat Veriyor)';
    } else {
      equilibriumStatus = 'PARETO_ETKIN';
      equilibriumLabel = '🔄 Kısmi Uzlaşma Dengesi';
    }
  }

  let paretoImprovementHint: string | null = null;
  if (dominatedBy) {
    const titles = dominatedBy.combo.map((id) => TITLE_MAP[id]).join(' + ');
    paretoImprovementHint = `Oyun teorisi ipucu: Aynı bütçe sınırında "${titles}" kombinasyonu hiçbir komisyonu geriletmeden toplam faydayı artırabiliyor.`;
  } else if (pickedIds.length > 0 && SOLUTION_BUDGET - totalCost >= 100_000 && !pickedIds.includes('saving-campaign')) {
    paretoImprovementHint = `Kasada kalan ₺${(SOLUTION_BUDGET - totalCost).toLocaleString('tr-TR')} ile başka bir tedbir daha eklenerek Pareto verimliliği yükseltilebilir.`;
  }

  const topSacrifice = sacrifices[0];
  const summaryText =
    pickedIds.length === 0
      ? 'Meclis masasında henüz bir strateji kurulmadı. Bütçe kısıtı altında her seçim bir vazgeçiş (fırsat maliyeti) içerir.'
      : `Nash Uzlaşma Skoru %${nashScore}. ${
          topSacrifice
            ? `En büyük feragat: ${topSacrifice.affectedStakeholder} alanında "${topSacrifice.title}" (${topSacrifice.forgoneWaterL} L/dk potansiyel) yerine seçilen öncelikler tercih edildi.`
            : 'Tüm ana kalemler kapsandı.'
        }`;

  return {
    pickedIds,
    totalCost,
    payoffs: currentPayoffs,
    nashScore,
    nashOptimalIds: bestNashCombo,
    isParetoOptimal,
    paretoImprovementHint,
    equilibriumStatus,
    equilibriumLabel,
    sacrifices,
    summaryText,
  };
}
