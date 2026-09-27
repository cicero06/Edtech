/**
 * Chapter 1 story content: Lina's briefing, the mayor's mission card and the
 * four district investigation cards. Text is attached to ROLES, not to the
 * reference game's character names - our sprites keep their own identities.
 */

import { TextureKeys, type TextureKey } from './assets';
import type { StatChanges } from './stats';

export type InvestigationId = 'belediye' | 'baraj' | 'tarim' | 'konut' | 'park';

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
    hint: 'Su sınırlı bir kaynaktır.',
    datum: 'Rezerv: %43 dolu',
    checkQuestion: {
      question: 'Rezerv geçen yıl %70 doluydu, şimdi %43. Kaç puan azalmış?',
      options: ['13 puan', '27 puan', '43 puan'],
      correctIndex: 1,
      explanation: '70 − 43 = 27 puan azalmış. Su stoğumuz ciddi biçimde düşmüş.',
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
    datum: 'Boru kaçağı: sokakta aktif',
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
    datum: 'Park sulaması: günlük yüksek',
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
  },
  {
    id: 'saving-campaign',
    icon: '🚿',
    title: 'Tasarruf Kampanyası',
    cost: 80_000,
    text: 'Evlerde suyu daha dikkatli kullanmak için kasaba çapında kampanya.',
    whyCost: 'Afiş, broşür ve okul etkinlikleri ucuzdur ama etkisi sınırlıdır.',
    effects: { water: 10, society: 3 },
  },
  {
    id: 'repair-pipes',
    icon: '💧',
    title: 'Boru Kaçaklarını Onar',
    cost: 320_000,
    text: 'Sokaklardaki eski borular onarılır; kaybolan su geri kazanılır.',
    whyCost: 'Boru değiştirmek iş makinesi ve ekip ister — orta maliyet.',
    effects: { water: 20, economy: -5 },
  },
  {
    id: 'drip-irrigation',
    icon: '🌾',
    title: 'Damla Sulama Desteği',
    cost: 520_000,
    text: 'Tarlalara damla sulama sistemi kurulması için çiftçilere destek.',
    whyCost: 'Her tarlaya boru ve sistem döşenir — pahalı ama kalıcı kazanç.',
    effects: { water: 25, economy: 10, society: 5 },
  },
  {
    id: 'rain-harvest',
    icon: '🌧️',
    title: 'Yağmur Suyu Hasadı',
    cost: 700_000,
    text: 'Binaların çatı suları depolanıp bahçe ve park sulamasında kullanılır.',
    whyCost: 'Depo ve tesisat kurulumu en pahalısı — ama uzun vadede en büyük kazanç.',
    effects: { water: 30, environment: 15, economy: -10 },
  },
] as const;
