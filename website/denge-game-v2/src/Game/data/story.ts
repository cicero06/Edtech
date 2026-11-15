/**
 * Chapter 1 story content: Lina's briefing, the mayor's mission card and the
 * four district investigation cards. Text is attached to ROLES, not to the
 * reference game's character names - our sprites keep their own identities.
 */

import { TextureKeys, type TextureKey } from './assets';
import type { DialogueChoice } from '../events/gameEvents';
import type { StatChanges } from './stats';

export type InvestigationId = 'belediye' | 'baraj' | 'tarim' | 'konut' | 'park';

/** A small bar/line series rendered inside cards and dialogues. */
export interface ChartSeries {
  title: string;
  /** Value unit shown on the bars, e.g. '%'. */
  unit?: string;
  points: readonly { label: string; value: number }[];
}

/** The four districts whose hints can be marked as "evidence" in the notebook. */
export const EVIDENCE_IDS: readonly InvestigationId[] = ['baraj', 'tarim', 'konut', 'park'];

/** Lina's opening briefing, paged through the normal dialogue card. */
export const LINA_INTRO_PAGES: readonly string[] = [
  'Son birkaç haftadır kasabamızda bir şeyler değişmeye başladı. Barajdaki su seviyesi düşüyor. Bazı tarlalar yeterince sulanamıyor.',
  'Belediye, suyu nasıl kullanacağımız konusunda yeni bir plan hazırlamaya çalışıyor. Ama bu sadece suyla ilgili bir sorun değil. Kasabamızda evler, tarlalar, parklar ve belediye birbirine bağlı. Bir yerde aldığımız karar başka bir yerde farklı bir sonuç oluşturabilir.',
  'Belediye başkanı senden yardım istiyor. Kasabanın farklı bölgelerini inceleyip su sorununun nedenlerini keşfetmeye ve bir çözüm planı hazırlamaya ne dersin? Hadi, başkan belediye binasının önünde bekliyor!',
] as const;

/** Lina's line once every district card has been completed. */
export const LINA_REPORT_TEXT =
  'Harika! Bütün bölgeleri inceledin ve defterin doldu. Şimdi defterine bir bakalım: su sorununun hangi nedenlerini kanıtladın? İşaretledikten sonra bulgularımızla belediyeye döneceğiz.';

/** Shown above the notebook while the player marks confirmed causes. */
export const EVIDENCE_PROMPT = 'Defterine bak — su sorununun hangi nedenlerini kanıtladın?';

export interface InvestigationCard {
  id: InvestigationId;
  /** District header, e.g. '💧 BARAJ'. */
  icon: string;
  title: string;
  subtitle: string;
  npcName: string;
  npcRole: string;
  /** Character sheet used for the portrait's front frame. */
  portrait: TextureKey;
  paragraphs: readonly string[];
  listItems?: readonly { icon: string; text: string }[];
  factTitle?: string;
  fact?: string;
  /** "Kazanılan ipucu" - this is what lands in the notebook. */
  hint: string;
  /** Short concrete datum shown as a chip next to the notebook hint. */
  datum?: string;
  /**
   * Open hypothesis question (mayor card): no wrong answer, the pick only
   * unlocks the CTA - every guess leads to "we must investigate first".
   */
  hypothesis?: { question: string; options: readonly string[]; response: string };
  /** Chart shown above the check question - teaches graph reading. */
  chart?: ChartSeries;
  /**
   * One mini check question per card. A wrong pick shows the explanation and
   * still unlocks the CTA - thinking is the point, not grading.
   */
  checkQuestion?: {
    question: string;
    options: readonly string[];
    correctIndex: number;
    explanation: string;
  };
  cta: string;
}

export const INVESTIGATION_CARDS: readonly InvestigationCard[] = [
  {
    id: 'belediye',
    icon: '🏛️',
    title: 'BELEDİYE',
    subtitle: 'İhtiyaçlar ve Ortak Kararlar',
    npcName: 'Belediye Başkanı',
    npcRole: 'Belediye Başkanı',
    portrait: TextureKeys.MAYOR,
    paragraphs: [
      'Kasabayı gezmeye başladığını duydum, hoş geldin! Gördüğün gibi su sorunu yalnızca tek bir bölgeyi ilgilendirmiyor.',
      'Belediye olarak aynı anda tüm bu alanları düşünmek zorundayız:',
      'Ancak başka bir sınırımız daha var: 💰 Bütçe. Her çözümü aynı anda uygulayamayız. Bu nedenle hangi çözümlerin daha önemli olduğuna karar vermemiz gerekiyor.',
      'İlk görevin şu: kasabanın dört bölgesini gez, insanları dinle ve öğrendiklerini defterine kaydet. Sonra birlikte bir çözüm planı hazırlayacağız.',
    ],
    listItems: [
      { icon: '🏠', text: 'Evleri' },
      { icon: '🌾', text: 'Tarımı' },
      { icon: '🌳', text: 'Parkları' },
      { icon: '💧', text: 'Su rezervini' },
    ],
    hint: 'Karar verirken ihtiyaçları, sonuçları ve maliyeti birlikte düşünmeliyiz.',
    datum: 'Bütçe: ₺1.000.000',
    hypothesis: {
      question: 'Sence kasabadaki su neden azalıyor olabilir?',
      options: [
        'Yağışlar bu yıl azaldı',
        'Suyu her zamankinden çok kullanıyoruz',
        'Borularda kaçaklar olabilir',
      ],
      response:
        'Üçü de mümkün! Ama tahminle karar veremeyiz — önce kasabayı inceleyip kanıt toplamalıyız.',
    },
    cta: 'GÖREVE BAŞLA →',
  },
  {
    id: 'baraj',
    icon: '💧',
    title: 'BARAJ',
    subtitle: 'Kasabanın Su Rezervi',
    npcName: 'Aylin',
    npcRole: 'Su Mühendisi',
    portrait: TextureKeys.ENGINEER_AYLIN,
    paragraphs: [
      'Merhaba! Ben Aylin. Kasabanın su sistemini takip ediyorum.',
      'Şu gördüğün baraj, Denge Kasabası’nın en önemli su kaynaklarından biri. Yağmur ve kar suları barajda birikir. Daha sonra bu su evlerin, tarlaların ve kasabanın diğer ihtiyaçlarının karşılanması için kullanılabilir.',
      'Ancak barajdaki su miktarı her zaman aynı kalmaz. Şunlar barajdaki suyun azalmasına neden olabilir:',
    ],
    listItems: [
      { icon: '☀️', text: 'Yağışların azalması' },
      { icon: '💧', text: 'Suyun fazla kullanılması' },
      { icon: '🌡️', text: 'Sıcak havalarda buharlaşmanın artması' },
    ],
    factTitle: 'Biliyor muydun?',
    fact: 'Barajdaki su sadece bugün için değil, gelecekteki ihtiyaçlar için de önemlidir. Bu yüzden yalnızca "Şu anda ne kadar suyumuz var?" değil, "Daha sonra ne kadar suya ihtiyacımız olacak?" sorusunu da düşünmeliyiz.',
    hint: 'Barajdan çıkan 80 L suyun 20 L\'si yeraltı boru sızıntısında kayboluyor.',
    datum: 'Baraj çıkışı: 80 L',
    chart: {
      title: 'Rezerv Su Seviyesi',
      unit: '%',
      points: [
        { label: 'Geçen yıl', value: 70 },
        { label: 'Kış', value: 64 },
        { label: 'Bahar', value: 55 },
        { label: 'Bugün', value: 43 },
      ],
    },
    checkQuestion: {
      question: 'Grafiğe bak: rezerv hangi dönemde en hızlı düşmüş?',
      options: ['Geçen yıl - kış arası', 'Kış - bahar arası', 'Bahar - bugün arası'],
      correctIndex: 2,
      explanation:
        'Bahar’dan bugüne 55 → 43 = 12 puan düşmüş; önceki dönemler 9 ve 6 puandı. Düşüş yavaşlamıyor - hızlanıyor!',
    },
    cta: 'İNCELEMEYİ TAMAMLA →',
  },
  {
    id: 'tarim',
    icon: '🌾',
    title: 'TARIM',
    subtitle: 'Tarlalar ve Sulama',
    npcName: 'Rıza',
    npcRole: 'Çiftçi',
    portrait: TextureKeys.FARMER_RIZA,
    paragraphs: [
      'Hoş geldin! Ben Rıza. Bu tarlalarda ürün yetiştiriyorum.',
      'Bitkilerin büyüyebilmesi için suya ihtiyacımız var. Özellikle yağışların az olduğu zamanlarda tarlaları sulamamız gerekiyor.',
      'Ancak kullandığımız su miktarı şunlara göre değişebilir:',
    ],
    listItems: [
      { icon: '🌱', text: 'Yetiştirilen ürün' },
      { icon: '☀️', text: 'Hava koşulları' },
      { icon: '💧', text: 'Sulama yöntemi' },
    ],
    factTitle: 'İlginç bilgi',
    fact: 'Aynı miktarda su kullanan iki sulama yöntemi aynı sonucu vermeyebilir. Bazı yöntemlerde suyun bir kısmı bitkilere ulaşmadan kaybolabilir.',
    hint: 'Suyu azaltmak kadar, suyu nasıl kullandığımız da önemlidir.',
    datum: 'Sulama ihtiyacı: yüksek',
    checkQuestion: {
      question: 'Damla sulama neden daha az su harcar?',
      options: [
        'Suyu doğrudan bitkinin köküne verir',
        'Suyu tüm tarlaya yağmur gibi yayar',
        'Bitkileri daha az sulatır',
      ],
      correctIndex: 0,
      explanation:
        'Damla sulama suyu borularla doğrudan köke taşır; havaya ve boş toprağa su kaçmaz.',
    },
    cta: 'İNCELEMEYİ TAMAMLA →',
  },
  {
    id: 'konut',
    icon: '🏠',
    title: 'KONUT BÖLGESİ',
    subtitle: 'Evler ve Su Kullanımı',
    npcName: 'Nuri Amca',
    npcRole: 'Kasaba Sakini',
    portrait: TextureKeys.NURI_AMCA,
    paragraphs: [
      'Hoş geldin evladım! Ben Nuri. Kırk yıldır bu mahallede oturuyorum.',
      'Evlerimizde her gün su kullanıyoruz: içmek, temizlik, bahçe sulamak... Son zamanlarda musluklardaki su basıncı bile azaldı.',
      'Bir de şu var: bazı sokaklarda günlerdir akan bir sızıntı olduğunu söylüyorlar. Borular eskiyse suyun bir kısmı evlere ulaşmadan yolda kayboluyor olabilir.',
    ],
    listItems: [
      { icon: '🚿', text: 'Evlerdeki günlük kullanım' },
      { icon: '🌱', text: 'Bahçe sulamaları' },
      { icon: '🔧', text: 'Eskimiş borulardaki kaçaklar' },
    ],
    factTitle: 'Biliyor muydun?',
    fact: 'Bozuk bir musluk veya patlak bir boru, fark edilmeden yüzlerce litre suyu boşa harcayabilir. Küçük kaçaklar bile büyük kayıp demektir.',
    hint: 'Suyun bir kısmı kullanılmadan önce kayboluyor olabilir.',
    datum: 'Konut ölçümü: 35 L (basınç düşük)',
    checkQuestion: {
      question: 'Sokaktaki boru kaçağı tamir edilmezse ne olur?',
      options: [
        'Kaçan su evlere ulaşmadan kaybolmaya devam eder',
        'Musluklar daha güçlü akar',
        'Kaçak zamanla kendiliğinden kapanır',
      ],
      correctIndex: 0,
      explanation: 'Kaçak durdukça her gün temiz su boşa gider — onarmak kaybı durdurur.',
    },
    cta: 'İNCELEMEYİ TAMAMLA →',
  },
  {
    id: 'park',
    icon: '🌳',
    title: 'PARK',
    subtitle: 'Kasabanın Yeşil Alanları',
    npcName: 'Kemal',
    npcRole: 'Belediye Çalışanı',
    portrait: TextureKeys.WORKER_KEMAL,
    paragraphs: [
      'Merhaba! Ben Kemal. Kasabanın parkları ve yeşil alanlarıyla ilgileniyorum.',
      'Parklar yalnızca kasabanın güzel görünmesini sağlamaz. Ağaçlar ve yeşil alanlar:',
      'Ancak sıcak ve kurak dönemlerde onların da suya ihtiyacı vardır.',
    ],
    listItems: [
      { icon: '🌳', text: 'Gölge sağlayabilir' },
      { icon: '🐦', text: 'Canlılara yaşam alanı oluşturabilir' },
      { icon: '🌿', text: 'Şehir yaşamını daha yaşanabilir hale getirebilir' },
    ],
    hint: 'Bir kararın çevresel sonuçlarını da düşünmeliyiz.',
    datum: 'Park ölçümü: 25 L (ıslak zemin)',
    checkQuestion: {
      question: 'Park sulamasını tamamen kesersek ne olabilir?',
      options: [
        'Ağaçlar ve canlılar zarar görebilir',
        'Park hiç etkilenmez',
        'Havalar serinler',
      ],
      correctIndex: 0,
      explanation:
        'Yeşil alanlar da suya muhtaç — çözüm kesmek değil, dengelemek.',
    },
    cta: 'İNCELEMEYİ TAMAMLA →',
  },
] as const;

export function investigationCard(id: string): InvestigationCard | undefined {
  return INVESTIGATION_CARDS.find((c) => c.id === id);
}

// =========================================================================
// SOLUTION PACKAGE — the budget decision at the municipality meeting
// =========================================================================

/** The municipality's spendable budget. All costs are round multiples of ₺10k. */
export const SOLUTION_BUDGET = 1_000_000;

/** Stakeholder axis a solution serves - feeds the meeting's balance meter. */
export type Stakeholder = 'ev' | 'tarim' | 'park' | 'su';

/** When a measure pays off: immediate fix vs long-term infrastructure. */
export type Horizon = 'hemen' | 'orta' | 'uzun';

export const STAKEHOLDER_LABELS: Record<Stakeholder, string> = {
  ev: '🏠 Evler',
  tarim: '🌾 Tarım',
  park: '🌳 Park',
  su: '💧 Su',
};

export const HORIZON_LABELS: Record<Horizon, string> = {
  hemen: 'Hemen',
  orta: 'Orta vade',
  uzun: 'Uzun vade',
};

/** Short label naming the evidence a solution answers (shown on its card). */
export const RESOLVES_LABELS: Record<InvestigationId, string> = {
  belediye: 'Başkan’ın kaygısı',
  baraj: 'Aylin’in rezervuar verisi',
  tarim: 'Rıza’nın tarlaları',
  konut: 'Nuri Amca’nın kaçağı',
  park: 'Kemal’in fıskiyeleri',
};

export interface SolutionCard {
  id: string;
  icon: string;
  title: string;
  /** Cost in TL; the budget can't cover everything - that's the lesson. */
  cost: number;
  /** What the measure does, in the player's language. */
  text: string;
  /** Why it costs what it costs - makes the price meaningful, not abstract. */
  whyCost: string;
  effects: StatChanges;
  /** The district evidence this measure directly answers. */
  resolves: InvestigationId;
  /** Whose needs it serves - drives the balance meter in the panel. */
  serves: Stakeholder[];
  /** How soon the town feels it. */
  horizon: Horizon;
}

export const SOLUTION_CARDS: readonly SolutionCard[] = [
  {
    id: 'fountains-off',
    icon: '⛲',
    title: 'Fıskiyeleri Kapat',
    cost: 20_000,
    text: 'Parktaki fıskiyeler ve süs havuzları kısa süreliğine kapatılır.',
    whyCost: 'Neredeyse bedava — sadece vanalar kapatılır.',
    effects: { water: 5, society: -5 },
    resolves: 'park',
    serves: ['su'],
    horizon: 'hemen',
  },
  {
    id: 'saving-campaign',
    icon: '🚿',
    title: 'Tasarruf Kampanyası',
    cost: 80_000,
    text: 'Evlerde suyu daha dikkatli kullanmak için kasaba çapında kampanya.',
    whyCost: 'Afiş, broşür ve okul etkinlikleri ucuzdur ama etkisi sınırlıdır.',
    effects: { water: 10, society: 3 },
    resolves: 'konut',
    serves: ['ev', 'su'],
    horizon: 'orta',
  },
  {
    id: 'repair-pipes',
    icon: '💧',
    title: 'Boru Kaçaklarını Onar',
    cost: 320_000,
    text: 'Sokaklardaki eski borular onarılır; kaybolan su geri kazanılır.',
    whyCost: 'Boru değiştirmek iş makinesi ve ekip ister — orta maliyet.',
    effects: { water: 20, economy: -5 },
    resolves: 'konut',
    serves: ['su', 'ev'],
    horizon: 'hemen',
  },
  {
    id: 'drip-irrigation',
    icon: '🌾',
    title: 'Damla Sulama Desteği',
    cost: 520_000,
    text: 'Tarlalara damla sulama sistemi kurulması için çiftçilere destek.',
    whyCost: 'Her tarlaya boru ve sistem döşenir — pahalı ama kalıcı kazanç.',
    effects: { water: 25, economy: 10, society: 5 },
    resolves: 'tarim',
    serves: ['tarim', 'su'],
    horizon: 'orta',
  },
  {
    id: 'rain-harvest',
    icon: '🌧️',
    title: 'Yağmur Suyu Hasadı',
    cost: 700_000,
    text: 'Binaların çatı suları depolanıp bahçe ve park sulamasında kullanılır.',
    whyCost: 'Depo ve tesisat kurulumu en pahalısı — ama uzun vadede en büyük kazanç.',
    effects: { water: 30, environment: 15, economy: -10 },
    resolves: 'baraj',
    serves: ['su', 'park'],
    horizon: 'uzun',
  },
] as const;

/**
 * The mayor's closing remarks, compiled from which stakeholders the plan
 * actually serves - the player hears how the decision lands on real people.
 */
export function mayorReactionPages(solutionIds: readonly string[]): string[] {
  const picked = new Set(solutionIds);
  const lines: string[] = [];

  if (picked.has('repair-pipes'))
    lines.push('Nuri Amca ve mahalle sakinleri sokaktaki kaçağın biteceğini duyunca sevinecek.');
  if (picked.has('drip-irrigation'))
    lines.push('Rıza’nın tarlaları rahat bir nefes alacak — hem su kazanırız hem ürünler.');
  if (picked.has('fountains-off'))
    lines.push('Kemal fıskiyelerin kapanmasına biraz üzülecek ama park için su ayırdığımızı anlıyor.');
  if (picked.has('rain-harvest'))
    lines.push('Yağmur suyu depoları uzun vadede en büyük kazanç — Kemal parkı onlarla sulayacak.');
  if (picked.has('saving-campaign'))
    lines.push('Evlerde tasarruf kampanyası küçük görünür ama herkesi bu işe ortak eder.');

  const gaps: string[] = [];
  if (!picked.has('repair-pipes') && !picked.has('saving-campaign'))
    gaps.push('evler ve sokak kaçakları bekleyebilir');
  if (!picked.has('drip-irrigation')) gaps.push('tarlalar zorlanabilir');
  if (!picked.has('rain-harvest') && !picked.has('fountains-off'))
    gaps.push('parklar susuz kalabilir');
  if (gaps.length) lines.push(`Yalnız dikkat: ${gaps.join(', ')} — onları da düşünmemiz gerekecek.`);

  lines.push('Güzel düşünülmüş bir plan. Şimdi git, kararı kasaba halkına sen duyur — panoya da afişi asmayı unutma!');
  return lines;
}

// =========================================================================
// ANNOUNCEMENT ROUND — chapter close: the plan meets the people
// =========================================================================

/** The four residents the player must tell about the approved plan. */
export const ANNOUNCE_NPC_IDS: readonly string[] = [
  'muhendis-aylin',
  'ciftci-riza',
  'nuri-amca',
  'isci-kemal',
] as const;

/** The civic notice board where the plan poster is hung (next to the municipality). */
export const NOTICE_BOARD = { x: 1090, y: 1215, radius: 90 } as const;

// ---------------------------------------------------------------------------
// PUBLIC ANNOUNCEMENT — composing the town's post before it goes up
// ---------------------------------------------------------------------------

/** Free-choice visuals for the town's post - none is "wrong". */
export const ANNOUNCE_ICONS: readonly string[] = ['💧', '📢', '🛠️'] as const;

export interface AnnounceHeadline {
  id: string;
  text: string;
  /** Only an accurate headline may be posted - the others teach why not. */
  accurate: boolean;
  /** Shown when a misleading or vague headline is picked. */
  feedback?: string;
}

/**
 * Headline candidates for the town's post. Two options fail on purpose:
 * exaggeration and vagueness are the two classic ways announcements mislead.
 */
export const ANNOUNCE_HEADLINES: readonly AnnounceHeadline[] = [
  {
    id: 'h-exact',
    text: 'Su Planı Onaylandı — Uygulama Başlıyor',
    accurate: true,
  },
  {
    id: 'h-solved',
    text: 'Su Sorunu Tamamen Çözüldü!',
    accurate: false,
    feedback:
      'Dikkat! Plan daha uygulamaya geçiyor - "tamamen çözüldü" demek halka yanlış bilgi vermek olur.',
  },
  {
    id: 'h-vague',
    text: 'Belediyede Bir Şeyler Oluyor',
    accurate: false,
    feedback: 'Bu başlık kimseye bir şey söylemiyor - duyuru net ve bilgilendirici olmalı.',
  },
] as const;

/** Placeholder/hint for the free-text message box. */
export const ANNOUNCE_MESSAGE_HINT =
  'Planın ne yapacağını ve sonuçları birlikte izleyeceğimizi yaz...';

/** Post length limit - like a real social post, short and clear. */
export const ANNOUNCE_MESSAGE_MAX = 140;

/**
 * Each resident reacts to what the submitted plan actually picked - chosen
 * measures get joy, missed ones get patient disappointment. Returns null for
 * NPCs outside the announcement round.
 */
export function npcPlanReaction(npcId: string, solutionIds: readonly string[]): string | null {
  const picked = new Set(solutionIds);
  switch (npcId) {
    case 'muhendis-aylin':
      return picked.has('rain-harvest')
        ? 'Yağmur suyu depoları ha? Rezervi uzun vadede en çok rahatlatacak hamle bu - akıllıca seçim. Seviyeyi birlikte izleyeceğiz.'
        : 'Plan uygulamaya geçti, ölçümlere devam edeceğim. Rezervin toparlanması zaman alır ama doğru adım attın.';
    case 'ciftci-riza':
      return picked.has('drip-irrigation')
        ? 'Damla sulama desteği! Tam da umduğum şey - suyu köke veririz, hem tarla hem cebimiz rahatlar. Sağ ol evladım!'
        : 'Damla sulama bu sefer olmadı demek... Olsun, suyu yine idareli kullanırız. Belki bir sonraki bütçede.';
    case 'nuri-amca':
      if (picked.has('repair-pipes'))
        return 'Sokaktaki kaçak onarılacak mı? Vay be! Kırk yıldır kimse el atmadı şu boruya. Eline sağlık evladım!';
      if (picked.has('saving-campaign'))
        return 'Tasarruf kampanyası ha? Ben üzerime düşeni yaparım - musluklar kapanacak, bahçe az sulanacak.';
      return 'Kaçak hâlâ akıyor ama bekleriz artık. Sen elinden geleni yaptın evladım.';
    case 'isci-kemal':
      if (picked.has('rain-harvest'))
        return 'Çatı suları parka mı gelecek? Ağaçlar bayram edecek! Vanaları ben ayarlarım, sen merak etme.';
      if (picked.has('fountains-off'))
        return 'Fıskiyeler kapanıyor... Biraz üzülüyorum ama ağaçlara su ayırdığınızı biliyorum - doğru karar.';
      return 'Plan ne oldu bakalım? Parkı günlük sulamaya devam edeceğiz ama idareli olacağım, söz.';
    default:
      return null;
  }
}

/** Lina's reflective closer - asked once every resident knows the plan. */
export const LINA_CLOSING_PAGES: readonly string[] = [
  'Herkese haberi verdin, afiş de panoda! Kasaba artık planı biliyor.',
  'Karar vermek kolay değildi, değil mi? Söyle bakalım - bu planı hazırlarken seni en çok ne düşündürdü?',
] as const;

export const LINA_CLOSING_CHOICES: readonly DialogueChoice[] = [
  { id: 'closing-budget', text: 'Bütçe yetmedi, hepsini yapamadım' },
  { id: 'closing-fairness', text: 'Herkesi memnun edemedim' },
  { id: 'closing-evidence', text: 'Kanıtlar olmasa karar veremezdim' },
] as const;

/** Lina's spoken reply to each reflective pick - shown as a toast over her. */
export const LINA_CLOSING_FEEDBACK: Record<string, string> = {
  'closing-budget': 'Aynen öyle - sınırlı kaynakla seçim yapmak gerçek hayattaki en zor iş!',
  'closing-fairness': 'Kimseyi dışarıda bırakmak istemezdin, biliyorum. Denge işte tam da bu demek.',
  'closing-evidence': 'İşte bu! Kanıt olmadan verilen karar tahmindir - sen gerçek bir araştırmacı gibi davrandın.',
};

// =========================================================================
// CHAPTER 2 — the plan meets reality
//
// Panodaki duyuru bölüm sonu değil, ikinci bölümün başlangıcı: oyuncu önce
// beklentisini söyler, uygulama kasabada görünür olur, 30 gün üç durakta
// geçer, aynı insanlar yeniden dinlenir, bulgular belediyeye sunulur ve
// isteyen aynı başlangıç koşullarıyla alternatif bir plan dener.
// =========================================================================

/** Lina turns the announcement into a hypothesis the finale can revisit. */
export const LINA_EXPECTATION_PAGES: readonly string[] = [
  'Herkes planı öğrendi. Şimdi uygulamanın kasabayı nasıl değiştireceğini göreceğiz.',
  'Sence bir ay sonra en çok nerede fark olacak?',
] as const;

export const EXPECTATION_CHOICES: readonly DialogueChoice[] = [
  { id: 'expect-water', text: 'Barajdaki su toparlanmaya başlar' },
  { id: 'expect-people', text: 'İnsanların günlük hayatı rahatlar' },
  { id: 'expect-unsure', text: 'Bazı konularda hâlâ emin değilim' },
] as const;

export const EXPECTATION_FEEDBACK: Record<string, string> = {
  'expect-water': 'Bunu defterine not ettik - bir ay sonra birlikte bakacağız.',
  'expect-people': 'Güzel bir beklenti - ay sonunda kasabalının ne dediğini dinleriz.',
  'expect-unsure': 'Dürüst bir cevap! Emin olmadıklarını da izlemek araştırmanın parçası.',
};

/**
 * One stop on the 30-day timeline: banner text, the date/time the calendar
 * and clock show, and a world tint matching that time of day.
 */
export interface DayStop {
  label: string;
  date: string;
  time: string;
  /** CSS rgba overlay - cool morning, bright noon, golden evening. */
  tint: string;
}

export const DAY_STOPS = {
  start: {
    label: '3. gün — Uygulama başlıyor',
    date: '3 Nisan',
    time: '08:15',
    tint: 'rgba(96, 140, 200, 0.10)',
  },
  mid: {
    label: '15. gün — Ayın ortası',
    date: '17 Nisan',
    time: '12:30',
    tint: 'rgba(255, 240, 200, 0.06)',
  },
  end: {
    label: '30. gün — Bir ay geçti',
    date: '2 Mayıs',
    time: '17:40',
    tint: 'rgba(255, 166, 77, 0.14)',
  },
  /** The retry rewinds to the same morning - same conditions, new decision. */
  retry: {
    label: 'Aynı sabaha dönüyoruz — Alternatif plan',
    date: '3 Nisan',
    time: '08:15',
    tint: 'rgba(96, 140, 200, 0.10)',
  },
} as const satisfies Record<string, DayStop>;

export type DayStopId = keyof typeof DAY_STOPS;

/**
 * Props that pop into the world when the plan starts being built.
 * `props[0]` appears at the "uygulama başlıyor" stop, `props[1]` at
 * "ayın ortası"; both stay for the rest of the chapter.
 */
export interface ImplementationProp {
  /** Only spawned when the active plan picked this solution. */
  solutionId: string;
  textureKey: TextureKey;
  x: number;
  /** Base line, same convention as world objects. */
  y: number;
  scale?: number;
  /** Flat floor decal instead of a y-sorted upright sprite. */
  ground?: boolean;
  collision?: { width: number; height: number };
}

export const IMPLEMENTATION_PROPS: readonly (readonly ImplementationProp[])[] = [
  // ---- stop 1: the work starts -------------------------------------------------
  [
    // repair-pipes: a worksite on the avenue by Nuri's street
    { solutionId: 'repair-pipes', textureKey: TextureKeys.SIGN, x: 1405, y: 868, scale: 0.45, collision: { width: 18, height: 10 } },
    { solutionId: 'repair-pipes', textureKey: TextureKeys.CRATE, x: 1445, y: 872, scale: 0.55, collision: { width: 36, height: 16 } },
    { solutionId: 'repair-pipes', textureKey: TextureKeys.CRATE, x: 1480, y: 866, scale: 0.55, collision: { width: 36, height: 16 } },
    { solutionId: 'repair-pipes', textureKey: TextureKeys.TRACTOR, x: 1560, y: 900, scale: 0.55, collision: { width: 36, height: 56 } },
    // drip-irrigation: materials delivered to the vegetable field
    { solutionId: 'drip-irrigation', textureKey: TextureKeys.CRATE, x: 300, y: 1132, scale: 0.55, collision: { width: 36, height: 16 } },
    { solutionId: 'drip-irrigation', textureKey: TextureKeys.CRATE, x: 335, y: 1140, scale: 0.55, collision: { width: 36, height: 16 } },
    { solutionId: 'drip-irrigation', textureKey: TextureKeys.BARREL_WOOD, x: 368, y: 1128, scale: 0.6, collision: { width: 22, height: 12 } },
    // saving-campaign: posters appear at the busy corners
    { solutionId: 'saving-campaign', textureKey: TextureKeys.SIGN, x: 1002, y: 856, scale: 0.42, collision: { width: 18, height: 10 } },
    { solutionId: 'saving-campaign', textureKey: TextureKeys.SIGN, x: 1332, y: 770, scale: 0.42, collision: { width: 18, height: 10 } },
    { solutionId: 'saving-campaign', textureKey: TextureKeys.SIGN, x: 1040, y: 1260, scale: 0.42, collision: { width: 18, height: 10 } },
    // rain-harvest: first tanks delivered beside the shop and houses
    { solutionId: 'rain-harvest', textureKey: TextureKeys.RAIN_TANK, x: 1330, y: 668, scale: 0.075, collision: { width: 34, height: 16 } },
    { solutionId: 'rain-harvest', textureKey: TextureKeys.RAIN_TANK, x: 1360, y: 676, scale: 0.065, collision: { width: 30, height: 14 } },
    { solutionId: 'rain-harvest', textureKey: TextureKeys.CRATE, x: 1290, y: 752, scale: 0.55, collision: { width: 36, height: 16 } },
    // fountains-off: a small notice by the silent fountain
    { solutionId: 'fountains-off', textureKey: TextureKeys.SIGN, x: 1032, y: 812, scale: 0.4, collision: { width: 18, height: 10 } },
  ],
  // ---- stop 2: the work settles in ----------------------------------------------
  [
    // repair-pipes: open trench patches along the avenue
    { solutionId: 'repair-pipes', textureKey: TextureKeys.SOIL_PATCH, x: 1430, y: 758, scale: 1.4, ground: true },
    { solutionId: 'repair-pipes', textureKey: TextureKeys.SOIL_PATCH, x: 1510, y: 770, scale: 1.4, ground: true },
    { solutionId: 'repair-pipes', textureKey: TextureKeys.SOIL_PATCH, x: 1590, y: 762, scale: 1.4, ground: true },
    // drip-irrigation: the rig is in, a tractor works the rows
    { solutionId: 'drip-irrigation', textureKey: TextureKeys.TRACTOR, x: 288, y: 1090, scale: 0.55, collision: { width: 36, height: 56 } },
    { solutionId: 'drip-irrigation', textureKey: TextureKeys.SIGN, x: 392, y: 1140, scale: 0.42, collision: { width: 18, height: 10 } },
    // saving-campaign: posters reach the farm road and the plaza
    { solutionId: 'saving-campaign', textureKey: TextureKeys.SIGN, x: 618, y: 772, scale: 0.42, collision: { width: 18, height: 10 } },
    { solutionId: 'saving-campaign', textureKey: TextureKeys.SIGN, x: 880, y: 1248, scale: 0.42, collision: { width: 18, height: 10 } },
    // rain-harvest: more tanks arrive at the apartment block
    { solutionId: 'rain-harvest', textureKey: TextureKeys.RAIN_TANK, x: 1740, y: 668, scale: 0.075, collision: { width: 34, height: 16 } },
    { solutionId: 'rain-harvest', textureKey: TextureKeys.RAIN_TANK, x: 1770, y: 676, scale: 0.065, collision: { width: 30, height: 14 } },
  ],
] as const;

/** Lina at the mid-month stop: progress plus the twist the plan surfaced. */
export const IMPLEMENT_MID_PAGES: readonly string[] = [
  'İki hafta geçti. Kasabada çalışmalar sürüyor - gördün mü?',
] as const;

/** Lina at day 30, right before the review round. */
export const IMPLEMENT_END_PAGES: readonly string[] = [
  'Bir ay geçti! Bir ay önce bu bölgeleri sorunu anlamak için gezmiştik.',
  'Şimdi aynı yerlere gidelim ama bu sefer neyin değiştiğini görmek için. Aylin, Rıza, Nuri Amca ve Kemal ile konuş - gördüklerini defterine ekle.',
] as const;

/** The most expensive picked measure - the one the mid-month twist follows. */
function primaryPickedSolution(solutionIds: readonly string[]): SolutionCard | undefined {
  return SOLUTION_CARDS
    .filter((c) => solutionIds.includes(c.id))
    .sort((a, b) => b.cost - a.cost)[0];
}

/**
 * The plan-linked complication Lina names mid-month. Not a punishment - every
 * option keeps its promise AND teaches something the player could not have
 * known at decision time. Returns the twist of the most expensive measure.
 */
export function implementationTwist(solutionIds: readonly string[]): string | null {
  const picked = primaryPickedSolution(solutionIds);
  if (!picked) return null;
  const twists: Record<string, string> = {
    'repair-pipes':
      'Kaçaklar kapandı, bu iyi haber. Ama kuraklık sürüyor - Aylin, rezervin beklenenden yavaş toparlandığını söylüyor.',
    'drip-irrigation':
      'Sistem kuruldu ama ortaya yeni bir ihtiyaç çıktı: Rıza ve komşuları, damla sulamayı doğru kullanmak için eğitim istiyor.',
    'saving-campaign':
      'Herkes kampanyayı duydu - ama bazı komşular önerileri günlük hayata nasıl uyarlayacağını tam bilmiyor.',
    'rain-harvest':
      'Depolar kuruldu ve hazır. Yalnız yağış az - depolar şimdilik yarım dolu, asıl katkı yağmurlu aylarda görülecek.',
    'fountains-off':
      'Fıskiyeler kapalı, tasarruf gerçek. Ama Kemal fark etti: bu küçük önlem tek başına yetmiyor gibi görünüyor.',
  };
  return twists[picked.id] ?? null;
}

/**
 * Where each twist lives on the map - the "dikkat" pin the mini-map shows once
 * the mid-month complication surfaces.
 */
const TWIST_SPOTS: Record<string, { x: number; y: number }> = {
  'repair-pipes': { x: 1520, y: 880 },
  'drip-irrigation': { x: 340, y: 1120 },
  'saving-campaign': { x: 1020, y: 1250 },
  'rain-harvest': { x: 1330, y: 680 },
  'fountains-off': { x: 960, y: 760 },
};

/** World position of the active mid-month twist, for the mini-map's ⚠ pin. */
export function implementationTwistSpot(
  solutionIds: readonly string[],
): { x: number; y: number } | null {
  const picked = primaryPickedSolution(solutionIds);
  return picked ? (TWIST_SPOTS[picked.id] ?? null) : null;
}

// ---------------------------------------------------------------------------
// REVIEW ROUND — same people, new question: what changed?
// ---------------------------------------------------------------------------

export interface ReviewOutcome {
  /** What the resident says on day 30. */
  text: string;
  /** The finding that lands in the notebook. */
  finding: { icon: string; text: string; datum?: string };
  /** Optional chart shown inside the review dialogue. */
  chart?: ChartSeries;
}

/** The before/after reservoir chart Aylin presents on day 30. */
function reservoirChart(after: number): ChartSeries {
  return {
    title: 'Rezerv Su Seviyesi',
    unit: '%',
    points: [
      { label: 'Plan öncesi', value: 43 },
      { label: '30. gün', value: after },
    ],
  };
}

/** Each review talk is keyed to what the plan actually picked. */
export function npcReviewOutcome(
  npcId: string,
  solutionIds: readonly string[],
): ReviewOutcome | null {
  const picked = new Set(solutionIds);
  switch (npcId) {
    case 'muhendis-aylin':
      if (picked.has('rain-harvest'))
        return {
          text: 'Yeni ölçümleri getirdim: çatı suları depolara akıyor, rezervdeki düşüş yavaşladı. Seviye %49 civarında. Yağmurlu bir ayda asıl farkı göreceğiz.',
          finding: { icon: '💧', text: 'Rezerv düşüşü yavaşladı.', datum: 'Seviye: %49' },
          chart: reservoirChart(49),
        };
      if (picked.has('repair-pipes'))
        return {
          text: 'Şebekedeki kayıp belirgin azaldı - kaçaklar kapanınca suyun daha çoğu eve ulaşıyor. Ama rezerv %46; kuraklık sürerken toparlanma yavaş.',
          finding: { icon: '💧', text: 'Şebeke kaybı azaldı, rezerv yavaş doluyor.', datum: 'Seviye: %46' },
          chart: reservoirChart(46),
        };
      return {
        text: 'Rezerv %44 civarında - geçen aya göre biraz iyi ama büyük bir değişim yok. Sistemsel bir adım atmadan toparlanma sınırlı kalıyor.',
        finding: { icon: '💧', text: 'Rezervde değişim sınırlı.', datum: 'Seviye: %44' },
        chart: reservoirChart(44),
      };
    case 'ciftci-riza':
      if (picked.has('drip-irrigation'))
        return {
          text: 'Damla sulama çalışıyor evladım! Aynı suyla daha çok tarla suluyorum. Yalnız bir şey var - sistemi doğru kullanmak için biraz eğitim lazım, yanlış ayarlayanlar var.',
          finding: { icon: '🌾', text: 'Damla sulama işe yaradı; kullanım eğitimi gerekiyor.', datum: 'Sulama verimi arttı' },
        };
      return {
        text: 'Tarlalar için doğrudan bir destek çıkmadı plandan. Vargel sulamaya devam ediyoruz - su yine yetmiyor, ürünler zorlanıyor.',
        finding: { icon: '🌾', text: 'Tarlalarda su sıkıntısı sürüyor.', datum: 'Sulama: hâlâ vargel' },
      };
    case 'nuri-amca':
      if (picked.has('repair-pipes'))
        return {
          text: 'Kaçak kapandı, musluklardaki basınç düzeldi! Çalışma sırasında iki gün su kesildi, biraz zorlandık ama değdi. Kırk yılda bir ilk!',
          finding: { icon: '🏠', text: 'Kaçak kapandı, basınç düzeldi; geçici kesinti zorladı.', datum: 'Kaçak: onarıldı' },
        };
      if (picked.has('saving-campaign'))
        return {
          text: 'Mahallede herkes musluğunu kısıyor, bahçeler az sulanıyor. Ama sokaktaki kaçak hâlâ akıyor evladım - gözüm hep orada.',
          finding: { icon: '🏠', text: 'Evlerde tasarruf arttı; sokak kaçağı sürüyor.', datum: 'Kaçak: aktif' },
        };
      return {
        text: 'Basınç hâlâ düşük, kaçak da akıyor. Bekliyoruz ama mahallede sabır azalıyor, onu da söyleyeyim.',
        finding: { icon: '🏠', text: 'Evlerde sorun devam ediyor.', datum: 'Basınç: düşük' },
      };
    case 'isci-kemal':
      if (picked.has('rain-harvest'))
        return {
          text: 'Depo suyuyla parkı suluyorum artık - ağaçlar rahatladı, şebeke suyu parka harcanmıyor. Bu iş tuttu!',
          finding: { icon: '🌳', text: 'Park depo suyuyla sulanıyor.', datum: 'Park sulaması: depodan' },
        };
      if (picked.has('fountains-off'))
        return {
          text: 'Fıskiyeler kapalı - tasarruf ediyoruz, doğru. Ama ağaçların günlük ihtiyacı devam ediyor; parkı idareli sulamaya devam edeceğiz.',
          finding: { icon: '🌳', text: 'Fıskiyeler kapandı; ağaçların su ihtiyacı sürüyor.', datum: 'Park: idareli sulama' },
        };
      return {
        text: 'Parkı hâlâ şebekeden suluyoruz - başka kaynak yok. Kuraklık sürerse yeşili korumak zorlaşacak.',
        finding: { icon: '🌳', text: 'Park hâlâ şebeke suyuyla sulanıyor.', datum: 'Park sulaması: şebeke' },
      };
    default:
      return null;
  }
}

export const REVIEW_NPC_IDS = ANNOUNCE_NPC_IDS;

// ---------------------------------------------------------------------------
// DEBRIEF — the first council report, built from the player's own findings
// ---------------------------------------------------------------------------

export const MAYOR_DEBRIEF_PAGES: readonly string[] = [
  'Hoş geldin! Bir ayı geride bıraktık - kasaba planının sonuçlarını konuşmak istiyor.',
  'Defterindeki bulgularla kısa bir rapor hazırla: ne işe yaradı, hangi sorun devam ediyor, bunu hangi gözleme dayanarak söylüyorsun?',
] as const;

/** Shown above the notebook while the player picks findings for the report. */
export const REPORT_PROMPT =
  'Bulgularını sınıflandır: hangisi neyin işe yaradığını, hangisi süren sorunu gösteriyor? Bir bulgu ikisine de girebilir — gerçek raporlar böyle yazılır.';

export const MAYOR_FOLLOWUP_QUESTION =
  'Güzel bir rapor. Peki sence bundan sonra en çok neye dikkat etmeliyiz?';

/** Follow-up choices derive from what the plan left unserved. */
export function mayorFollowUpChoices(solutionIds: readonly string[]): DialogueChoice[] {
  const picked = new Set(solutionIds);
  const choices: DialogueChoice[] = [];
  if (!picked.has('repair-pipes') && !picked.has('saving-campaign'))
    choices.push({ id: 'gap-ev', text: 'Evler ve sokak kaçakları' });
  if (!picked.has('drip-irrigation'))
    choices.push({ id: 'gap-tarim', text: 'Tarlaların sulama sorunu' });
  if (!picked.has('rain-harvest') && !picked.has('fountains-off'))
    choices.push({ id: 'gap-park', text: 'Parkın su ihtiyacı' });
  if (!picked.has('rain-harvest') && !picked.has('repair-pipes') && !picked.has('drip-irrigation'))
    choices.push({ id: 'gap-rezerv', text: 'Rezervin yavaş toparlanması' });
  choices.push({ id: 'gap-watch', text: 'Dengeli gidiyoruz - izlemeye devam' });
  return choices;
}

export const MAYOR_FOLLOWUP_FEEDBACK: Record<string, string> = {
  'gap-ev': 'Haklısın - mahallelerin sabrı tükeniyor, bunu gündeme alacağım.',
  'gap-tarim': 'Rıza haklı olarak bekliyor. Tarımsız bir kasaba düşünemeyiz.',
  'gap-park': 'Yeşili kaybedersek geri kazanması yıllar alır - not aldım.',
  'gap-rezerv': 'Doğru tespit. Kuru bir ay daha geçerse yeni kararlar gerekebilir.',
  'gap-watch': 'Dengeyi korumak da bir karardır. Verileri izlemeye devam edelim.',
};

// ---------------------------------------------------------------------------
// SECOND CHANCE — same starting conditions, different decision
// ---------------------------------------------------------------------------

export const LINA_RETRY_PAGES: readonly string[] = [
  'Artık başta bilmediğimiz şeyler biliyoruz. Aynı güne dönebilseydin neyi farklı yapardın?',
  'İstersen başka bir planın nasıl sonuçlanacağını birlikte deneyelim - koşullar aynı, bütçe aynı, karar senin. Ya da öğrendiklerinle ilk planını koruyabilirsin; o da anlamlı bir sonuç.',
] as const;

export const RETRY_CHOICES: readonly DialogueChoice[] = [
  { id: 'retry-alt', text: 'Başka bir planı dene' },
  { id: 'retry-keep', text: 'Öğrendiklerimle planımı koruyorum' },
] as const;

export const RETRY_KEEP_FEEDBACK =
  'Yeni bilgiyle planını gerekçelendirerek korudun - bu da güçlü bir karar!';

/** Lina compares the two runs right after the alternative is submitted. */
export function linaComparePages(
  firstIds: readonly string[],
  secondIds: readonly string[],
): string[] {
  const first = new Set(firstIds);
  const second = new Set(secondIds);
  const added = SOLUTION_CARDS.filter((c) => second.has(c.id) && !first.has(c.id));
  const dropped = SOLUTION_CARDS.filter((c) => first.has(c.id) && !second.has(c.id));

  const lines: string[] = [];
  if (added.length || dropped.length) {
    if (dropped.length) lines.push(`Bu sefer ${dropped.map((c) => c.title).join(', ')} yerine`);
    if (added.length) lines.push(`${added.map((c) => c.title).join(', ')} seçtin.`);
  } else {
    lines.push('İkinci denemede aynı planı seçtin - bu da bir cevap.');
  }
  lines.push('Aynı koşullarla otuz günü bir daha yaşadık. Şimdi iki denemeyi yan yana görme zamanı - başkan final sunumunu bekliyor.');
  return lines;
}

// ---------------------------------------------------------------------------
// FINALE — the mayor's evaluation, then the player's closing statement
// ---------------------------------------------------------------------------

export function mayorFinalePages(hasAlt: boolean): string[] {
  const lines = [
    'Kasaba bir aylık yolculuğu tamamladı. Kararının sonuçlarını izledin, insanları dinledin, raporunu sundun.',
  ];
  if (hasAlt) {
    lines.push('Üstüne bir de alternatif planı denedin - aynı koşullarda iki farklı kararın neye yol açtığını gördün. Bu, gerçek karar vericilerin bile nadiren sahip olduğu bir şans.');
  }
  lines.push('Şimdi son söz sende: defterine, planlarına ve beklentine bak - kapanış değerlendirmeni yaz.');
  return lines;
}
