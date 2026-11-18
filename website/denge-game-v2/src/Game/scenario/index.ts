/**
 * The game's door to the scenario engine: which variant the active student
 * plays, and the scenario-aware versions of the story pieces that quote
 * numbers or results. Everything here reads the session; model/variants/
 * texts stay pure so the build-time checker can load them in Node.
 */
import {
  investigationCard,
  implementationTwist,
  type ChartSeries,
  type InvestigationCard,
  type SolutionCard,
} from '../data/story';
import { loadSession, type GameSession } from '../data/session';
import type { StatChanges } from '../data/stats';
import { facts, simulate, type Outcome, type ScenarioFacts, type SolutionId } from './model';
import { say, type BeatId, type TextContext } from './texts';
import { DEFAULT_PARAMS, type ScenarioState } from './variants';

/** Old saves (before the engine) keep the numbers they were already shown. */
export function scenarioOf(session: GameSession | null | undefined): ScenarioState {
  return session?.scenario ?? { seed: session?.studentId ?? 'default', params: DEFAULT_PARAMS };
}

export function activeScenario(): ScenarioState {
  return scenarioOf(loadSession());
}

export function activeFacts(): ScenarioFacts {
  return facts(activeScenario().params);
}

function ctx(state: ScenarioState, picks?: readonly string[]): TextContext {
  return {
    f: facts(state.params),
    o: picks ? simulate(state.params, picks) : undefined,
    seed: state.seed,
  };
}

const line = (beat: BeatId, c: TextContext) => say(beat, c);

/** A district card with this student's numbers (hint, datum, chart, explanation). */
export function scenarioCard(id: string, state: ScenarioState = activeScenario()): InvestigationCard | undefined {
  const card = investigationCard(id);
  if (!card) return card;
  const c = ctx(state);
  const f = c.f;
  switch (card.id) {
    case 'baraj':
      return {
        ...card,
        hint: line('baraj.hint', c) ?? card.hint,
        datum: line('baraj.datum', c) ?? undefined,
        chart: card.chart && {
          ...card.chart,
          points: [
            { label: 'Geçen yıl', value: f.history.lastYear },
            { label: 'Kış', value: f.history.winter },
            { label: 'Bahar', value: f.history.spring },
            { label: 'Bugün', value: f.history.today },
          ],
        },
        checkQuestion: card.checkQuestion && {
          ...card.checkQuestion,
          explanation: line('baraj.explanation', c) ?? card.checkQuestion.explanation,
        },
      };
    case 'konut':
      return { ...card, datum: line('konut.datum', c) ?? undefined };
    case 'park':
      return { ...card, datum: line('park.datum', c) ?? undefined };
    default:
      return card;
  }
}

/** The day-30 report the plan earns in this student's town. */
export interface ReviewOutcome {
  text: string;
  finding: { icon: string; text: string; datum?: string };
  chart?: ChartSeries;
}

const REVIEW_BEATS: Record<string, { icon: string; review: BeatId; finding: BeatId; datum: BeatId; extra?: BeatId }> = {
  'muhendis-aylin': { icon: '💧', review: 'aylin.review', finding: 'aylin.finding', datum: 'aylin.datum', extra: 'aylin.rainNote' },
  'ciftci-riza': { icon: '🌾', review: 'riza.review', finding: 'riza.finding', datum: 'riza.datum' },
  'nuri-amca': { icon: '🏠', review: 'nuri.review', finding: 'nuri.finding', datum: 'nuri.datum' },
  'isci-kemal': { icon: '🌳', review: 'kemal.review', finding: 'kemal.finding', datum: 'kemal.datum' },
};

export function reviewOutcome(
  npcId: string,
  picks: readonly string[],
  state: ScenarioState = activeScenario(),
): ReviewOutcome | null {
  const beats = REVIEW_BEATS[npcId];
  if (!beats) return null;
  const c = ctx(state, picks);
  const text = line(beats.review, c);
  const finding = line(beats.finding, c);
  // Nothing consistent to say → the resident says nothing scripted.
  if (!text || !finding) return null;
  const extra = beats.extra ? line(beats.extra, c) : null;
  const o = c.o as Outcome;
  return {
    text: extra ? `${text} ${extra}` : text,
    finding: { icon: beats.icon, text: finding, datum: line(beats.datum, c) ?? undefined },
    chart:
      npcId === 'muhendis-aylin'
        ? {
            title: 'Rezerv Su Seviyesi',
            unit: '%',
            points: [
              { label: 'Plan öncesi', value: o.reservoirBefore },
              { label: 'Plansız olsaydı', value: o.reservoirNoPlan },
              // Last bar is highlighted by ChartView — the student's own result.
              { label: 'Planla 30. gün', value: o.reservoirAfter },
            ],
          }
        : undefined,
  };
}

/** Mid-month twist; the repair crews' line quotes the reservoir, so it comes from the bank. */
export function scenarioTwist(picks: readonly string[], state: ScenarioState = activeScenario()): string | null {
  const twist = implementationTwist(picks);
  if (!twist) return null;
  if (twist.startsWith('Kaçaklar kapandı')) return line('twist.repair', ctx(state, picks));
  return twist;
}

/** Whether a twist line carries scenario numbers/claims (its old recording would disagree). */
export function twistIsScenarioText(picks: readonly string[]): boolean {
  return !!implementationTwist(picks)?.startsWith('Kaçaklar kapandı');
}

/** Water-axis points per reservoir point a measure adds (keeps the HUD scale of the old cards). */
const WATER_STAT_PER_POINT = 4;

/**
 * Stat changes for a submitted plan: economy/society/environment as on the
 * cards, but the water axis follows what each measure actually gave back in
 * this student's town.
 */
export function planEffects(
  selected: readonly SolutionCard[],
  state: ScenarioState = activeScenario(),
): StatChanges[] {
  const o = simulate(state.params, selected.map((c) => c.id));
  return selected.map((card) => ({
    ...card.effects,
    water: Math.round((o.contributionPts[card.id as SolutionId] ?? 0) * WATER_STAT_PER_POINT),
  }));
}

/** Short variant summary for the teacher report. */
export function scenarioSummary(state: ScenarioState): string {
  const f = facts(state.params);
  return `Baraj çıkışı ${f.outflowL} L/dk · kaçak ${f.leakL} L/dk (%${f.leakPct}) · rezerv %${f.reservoirPct} · yağış açığı %${f.rainDeficitPct}`;
}

function hashSeed(seed: string, salt: string): number {
  const s = `${seed}:${salt}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pickLine<T>(seed: string, salt: string, options: readonly T[]): T {
  return options[hashSeed(seed, salt) % options.length];
}

/** Scenario-specific opening briefing from Lina, quoting this student's town numbers. */
export function scenarioLinaIntroPages(state: ScenarioState = activeScenario()): string[] {
  const f = facts(state.params);
  const p1 = pickLine(state.seed, 'intro-1', [
    `Hoş geldin! Son haftalarda kasabamızda ciddi bir su sıkıntısı başladı: yağışlar normalin %${f.rainDeficitPct} altında kaldı ve baraj doluluğumuz %${f.history.spring} seviyesinden %${f.reservoirPct} seviyesine kadar geriledi.`,
    `İyi ki geldin! Bu mevsim yağışlar %${f.rainDeficitPct} azaldı, buharlaşma ise %${f.evaporationPct} arttı. Baraj rezervuarımız bugün itibarıyla %${f.reservoirPct} seviyesine düştü ve kritik eşiğimiz olan %${f.criticalPct} sınırına yaklaşıyor.`,
    `Kasabamızda işler biraz karışık: barajımız geçen yıldan beri %${f.history.lastYear} seviyesinden %${f.reservoirPct} doluluğa indi. Üstelik barajdan çıkan ${f.outflowL} L/dk suyun tamamı musluklara ulaşmıyor gibi görünüyor.`,
  ]);
  const p2 = pickLine(state.seed, 'intro-2', [
    `Belediye yeni bir su planı hazırlamak istiyor ama her bölge birbirine bağlı: evler dakikada ${f.homesL} L, Merkez Park ${f.parkL} L, tarlalar ise kanaldan ${f.farmL} L su çekiyor. Bir yerde aldığımız karar diğer bölgeyi doğrudan etkiliyor.`,
    `Bu sadece barajın sorunu değil; mahallede basınç düşüklüğü var, Çiftçi Rıza’nın tarlaları dakikada ${f.farmL} L suya ihtiyaç duyuyor ve parkın yeşil kalması gerekiyor. Kısacası tüm kasaba tek bir su sisteminin parçası.`,
  ]);
  const p3 = pickLine(state.seed, 'intro-3', [
    `Belediye Başkanı Adil, ₺1.000.000 bütçeyle en doğru müdahale paketini kurmamız için seni bekliyor. Önce güneydeki belediye binasına uğrayalım, ardından dört bölgedeki uzmanlarımızdan kanıt toplayalım!`,
    `Başkan Adil belediye binasının önünde bizi bekliyor! Önce onunla konuşup görevi alalım, sonra Baraj, Konut, Park ve Tarım bölgelerindeki gerçek verileri defterimize işleyelim.`,
  ]);
  return [p1, p2, p3];
}

/** Scenario-aware small talk so NPCs never repeat generic hardcoded lines across different scenarios. */
export function scenarioNpcSmallTalk(
  npcId: string,
  fallbackText: string,
  state: ScenarioState = activeScenario(),
): string {
  const f = facts(state.params);
  switch (npcId) {
    case 'muhendis-aylin':
      return pickLine(state.seed, 'talk-aylin', [
        `Baraj rezervuarımız şu an %${f.reservoirPct} seviyesinde ve dakikada ${f.outflowL} L su veriyoruz; fakat kayıtlara göre bunun ${f.leakL} L/dk kadarı (%${f.leakPct}) yolda kayboluyor!`,
        `Ölçüm ekranına bak: rezerv %${f.history.lastYear} seviyesinden %${f.reservoirPct} seviyesine indi. Kritik eşiğimiz %${f.criticalPct}; şebekedeki ${f.leakL} L/dk sızıntıyı durdurmazsak işimiz zor.`,
      ]);
    case 'ciftci-riza':
      return pickLine(state.seed, 'talk-riza', [
        `Buharlaşma bu sezon %${f.evaporationPct} arttı evlat! Tarla kanalından dakikada ${f.farmL} L su çekiyoruz ama açık salma sulamada suyun çoğu toprağa varmadan uçup gidiyor.`,
        `Bereket Vadisi’nde dakikada ${f.farmL} L su kullanıyoruz. Damla sulama sistemine geçersek bu tüketimi üçte bir oranında azaltabiliriz ama kurulum bütçesi gerekiyor.`,
      ]);
    case 'nuri-amca':
      return pickLine(state.seed, 'talk-nuri', [
        `Çınar Caddesi’nde evlere dakikada ${f.homesL} L su ancak ulaşıyor evladım; çünkü yeraltındaki çatlak borulardan dakikada tam ${f.leakL} L temiz su toprağa karışıyor!`,
        `Kırk yıldır bu mahalledeyim, muslukların bu kadar cılız aktığını görmedim. Barajdan çıkan suyun %${f.leakPct}’i bizim sokağın altındaki eski borulardan boşa akıyor.`,
      ]);
    case 'isci-kemal':
      return pickLine(state.seed, 'talk-kemal', [
        `Merkez Park şu an dakikada ${f.parkL} L su çekiyor. Fıskiyeleri öğle sıcağında çalıştırmak yerine akıllı sulamaya geçersek dakikada ${f.kemalSaveL} L suyu hemen kurtarırız.`,
        `Parkımız kasabanın nefes borusu; dakikada ${f.parkL} L su kullanıyoruz. Süs fıskiyelerini kapatıp yağmur suyu depolarsak ağaçları kurutmadan şebekeyi rahatlatabiliriz.`,
      ]);
    case 'mayor':
      return pickLine(state.seed, 'talk-mayor', [
        `Rezervuarımız %${f.reservoirPct} seviyesinde ve elimizde tam ₺1.000.000 bütçe var. Hem ${f.leakL} L/dk şebeke kaçağını hem de ${f.farmL} L/dk tarım ihtiyacını kanıtlarla tartmalıyız.`,
        `Kasabanın su dengesi senin toplayacağın kanıtlara bağlı. Barajdan çıkan ${f.outflowL} L/dk suyu en adil ve kalıcı biçimde nasıl koruyacağımıza mecliste karar vereceğiz.`,
      ]);
    case 'lina':
      return pickLine(state.seed, 'talk-lina', [
        `Defterimize baktın mı? Barajımız %${f.reservoirPct} seviyesinde, şebekede ${f.leakL} L/dk kaçak var ve tarlalar ${f.farmL} L/dk su çekiyor. Sence önce hangisine müdahale etmeliyiz?`,
        `Okulda ve mahallede herkes su krizini konuşuyor. Barajdan çıkan ${f.outflowL} L/dk suyun %${f.leakPct}’i yolda kaybolurken her bölgenin sesini dinlememiz çok önemli!`,
      ]);
    case 'elif-teyze':
      return pickLine(state.seed, 'talk-elif', [
        `Yağmurlar bu yıl %${f.rainDeficitPct} az yağdı evladım, sebze bahçelerimiz kuruyor. Hem çiftçiyi hem evlerin içme suyunu gözetecek bir çare bulmalıyız.`,
        `Eskiden barajımız %${f.history.lastYear} dolu olurdu, şimdi %${f.reservoirPct}’e düşmüş diyorlar. Gençlerin bilime ve kanıta dayalı bir plan kuracağına güveniyorum.`,
      ]);
    default:
      return fallbackText;
  }
}

/** Scenario-aware resident reaction during the announcement round. */
export function scenarioNpcPlanReaction(
  npcId: string,
  solutionIds: readonly string[],
  state: ScenarioState = activeScenario(),
): string | null {
  const f = facts(state.params);
  const o = simulate(state.params, solutionIds);
  const has = (id: SolutionId) => solutionIds.includes(id);

  switch (npcId) {
    case 'muhendis-aylin':
      if (has('repair-pipes') && has('rain-harvest')) {
        return `Planını inceledim! Hem ${f.leakL} L/dk boru kaçağını onarıp ${Math.round(o.savedL['repair-pipes'] ?? 0)} L/dk suyu kurtarmışsın hem de yağmur depolarını eklemişsin. Hesaplarıma göre rezerv %${o.reservoirBefore}’den %${o.reservoirAfter}’e çıkacak!`;
      }
      if (has('repair-pipes')) {
        return `Şebeke onarımını plana alman mühendislik açısından çok yerinde! Dakikada ${f.leakL} L kaçağın ${Math.round(o.savedL['repair-pipes'] ?? 0)} L’sini geri kazanacağız; rezerv %${o.reservoirAfter} seviyesine yöneliyor.`;
      }
      if (has('rain-harvest')) {
        return `Yağmur suyu depoları harika bir yedek kaynak! Ancak şebekedeki ${f.leakL} L/dk boru kaçağı sürdükçe barajımız %${o.reservoirAfter} civarında zorlanabilir; bakalım 30. günde ne göreceğiz.`;
      }
      return `Planını duydum. Barajdan çıkan ${f.outflowL} L/dk suyun ${f.leakL} L/dk’sı hâlâ eski borulardan sızıyor; 30 gün sonunda rezervuarın %${o.reservoirAfter} seviyesinde nasıl tepki vereceğini yakından izleyeceğim.`;

    case 'ciftci-riza':
      if (has('drip-irrigation')) {
        return `Damla sulama desteğini plana koymuşsun, yüreğine sağlık! Kanaldan çektiğimiz ${f.farmL} L/dk su ${o.farmAfterL} L/dk’ya düşecek; hem ekinlerimiz kurtulacak hem kasabaya dakikada ${Math.round(o.savedL['drip-irrigation'] ?? 0)} L su kalacak!`;
      }
      return `Planında tarlalara damla sulama desteği göremedim evlat. Kanaldan dakikada ${f.farmL} L su çekmeye devam ediyoruz ama sıcaklar %${f.evaporationPct} arttığı için mahsulü korumakta zorlanacağız.`;

    case 'nuri-amca':
      if (has('repair-pipes')) {
        return `Belediye ekipleri sokağımıza geliyor demek! Dakikada ${f.leakL} L suyun boşa aktığı o patlak borular onarılınca kaçağımız ${o.leakAfterL} L/dk’ya düşecek ve evlerimizin musluk basıncı nihayet düzelecek!`;
      }
      if (has('saving-campaign')) {
        return `Tasarruf kampanyasına mahallece katılırız, dakikada ${o.homesSavingL} L su da arttırırız evladım; ama sokağın altındaki ${f.leakL} L/dk boru kaçağı dururken içim pek rahat değil.`;
      }
      return `Planı duydum ama bizim Çınar Caddesi’ndeki ${f.leakL} L/dk boru sızıntısı ve evlerin durumu için bir adım göremedim. Umarım musluklarımız tamamen kesilmez.`;

    case 'isci-kemal':
      if (has('rain-harvest') && has('fountains-off')) {
        return `Fıskiyeleri kapatıp yağmur suyu depolarını kurmak çok akıllıca! Parkın şebekeden çektiği ${f.parkL} L/dk su ${o.parkAfterL} L/dk’ya inecek, ağaçlarımızı depolanan yağmur suyuyla yaşatacağız.`;
      }
      if (has('rain-harvest')) {
        return `Parkın altına yağmur suyu depoları kurulacak olmasına çok sevindim! Şebekeden çektiğimiz ${f.parkL} L/dk yük yarı yarıya azalacak ve çınarlarımız kuraklığı hissetmeyecek.`;
      }
      if (has('fountains-off')) {
        return `Süs fıskiyelerini hemen bugün kapatıyorum; şebekeden çektiğimiz ${f.parkL} L/dk suyu ${o.parkAfterL} L/dk’ya düşüreceğiz. Çimler biraz sararabilir ama kasabanın içme suyundan kıymetli değil.`;
      }
      return `Parkımız dakikada ${f.parkL} L su kullanmaya devam ediyor. Sıcaklarda yeşil alanları korumak için elimden geleni yapacağım.`;

    default:
      return null;
  }
}

/** Scenario-aware Mayor reaction right after the council plan is submitted. */
export function scenarioMayorReactionPages(
  solutionIds: readonly string[],
  state: ScenarioState = activeScenario(),
): string[] {
  const f = facts(state.params);
  const o = simulate(state.params, solutionIds);
  const has = (id: SolutionId) => solutionIds.includes(id);
  const pages: string[] = [];

  const totalSavedL = Math.round(
    Object.values(o.savedL).reduce((sum, val) => sum + (val ?? 0), 0),
  );

  pages.push(
    `Meclisimiz kararını onayladı! Seçtiğin paketle kasabamızda dakikada toplam ${totalSavedL} L su tasarrufu ve kayıp önleme hedefliyoruz. 30 gün sonunda baraj rezervimizin %${o.reservoirBefore} seviyesinden %${o.reservoirAfter} seviyesine gelmesi öngörülüyor (hiçbir şey yapmasaydık %${o.reservoirNoPlan}’e düşecekti).`,
  );

  const missing: string[] = [];
  if (!has('repair-pipes')) {
    missing.push(`şebekedeki ${f.leakL} L/dk boru kaçağı`);
  }
  if (!has('drip-irrigation')) {
    missing.push(`tarlalardaki ${f.farmL} L/dk sulama yükü`);
  }
  if (!has('rain-harvest') && !has('fountains-off')) {
    missing.push(`parktaki ${f.parkL} L/dk tüketim`);
  }

  if (missing.length > 0) {
    pages.push(
      `Bütçemiz sınırlı olduğu için ${missing.join(' ve ')} bu paketin dışında kaldı. Bakalım bu ödünleşmeler 30 gün boyunca kasabada nasıl hissedilecek?`,
    );
  } else {
    pages.push(
      `Hem altyapıyı, hem tarımı, hem de ortak alanları kapsayan dengeli bir paket kurdun!`,
    );
  }

  pages.push(
    `Şimdi bu kararı kasaba halkına anlatma zamanı! Dört bölge temsilcimizle konuş ve ardından meydandaki Kasaba Sosyal Medya / Duyuru ekranından paylaşımını yayınla.`,
  );

  return pages;
}

/** Scenario-aware mid-month and day-30 Lina implementation lines. */
export function scenarioImplementPages(
  implPhase: number,
  solutionIds: readonly string[],
  state: ScenarioState = activeScenario(),
): string[] {
  const f = facts(state.params);
  const o = simulate(state.params, solutionIds);
  if (implPhase === 0) {
    const twist = scenarioTwist(solutionIds, state);
    const first = `15. gündeyiz! Ekipler sahada çalışıyor; baraj doluluğumuz %${o.reservoirBefore} seviyesinden şu an %${o.reservoirMid} seviyesine geldi (yağış açığımız hâlâ %${f.rainDeficitPct}).`;
    return twist ? [first, twist] : [first];
  }
  return [
    `30 gün tamamlandı! Uyguladığımız plan sonucunda baraj rezervimiz bugün %${o.reservoirAfter} seviyesinde (plansız kalsaydık %${o.reservoirNoPlan} olacaktı).`,
    `Şimdi Aylin, Rıza, Nuri Amca ve Kemal’i tekrar ziyaret edip 30 günün gerçek sonuçlarını defterimize kaydedelim!`,
  ];
}

