/**
 * Öğrenme profili — dört pedagojik ölçüm katmanının ortak veri ve mantığı.
 *
 *  1. KANIT AYIKLAMA: Kanıt masasına karışan söylentiler (ölçümsüz iddialar).
 *     Öğrenci ampirik saha verisini duyumdan ayırabiliyor mu?
 *  2. 15. GÜN KARŞI-HAMLESİ: Planın ihmal ettiği paydaş kendi çıkarına göre
 *     hareket eder (oyun teorisi / ortak malların trajedisi); öğrenci kriz
 *     anında bir ödünleşme seçer.
 *  3. KAVRAM ANAHTARLARI: Kürsüde hazır cümle yok; etiketler yalnızca yön
 *     verir, gerekçe öğrencinin kendi kelimeleridir.
 *  4. ATÖLYE + GRAFİK İZLERİ: Dört atölyenin ham metrikleri ve grafik
 *     sorularındaki yanılgılar, not vermeden betimleyici satırlara çevrilir.
 *
 * Buradaki her şey deterministiktir ve senaryo modelinin (rezerv/debi)
 * sayılarını DEĞİŞTİRMEZ — kriz etkileri yalnızca denge göstergelerine
 * (ekonomi/toplum/çevre/su HUD) yansır, böylece check:scenarios bozulmaz.
 */
import type { MinigameId, MinigameResult } from './minigames';
import type { StatChanges } from './stats';
import type { ScenarioFacts } from '../scenario/model';

// ---------------------------------------------------------------------------
// Küçük deterministik seçici (senaryo tohumuna bağlı)
// ---------------------------------------------------------------------------

function hash(seed: string, salt: string): number {
  const s = `${seed}:${salt}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// ===========================================================================
// 1. KANIT AYIKLAMA — söylenti / safsata çeldiricileri
// ===========================================================================

export interface RumorClaim {
  id: string;
  icon: string;
  /** Nereden duyuldu — kaynağın kendisi bir ipucu. */
  source: string;
  text: string;
  /** Seçilirse gösterilen nazik açıklama: neden kanıt sayılmaz? */
  whyNotEvidence: string;
}

export const RUMOR_CLAIMS: readonly RumorClaim[] = [
  {
    id: 'rumor-coffeehouse',
    icon: '☕',
    source: 'Kahvehane söylentisi',
    text: 'Barajda aslında su çok; ana borular hava yaptığı için sayaçlar düşük gösteriyormuş.',
    whyNotEvidence:
      'Bu bir duyum: kimin, neyi, nasıl ölçtüğü belli değil. Aylin’in seviye ölçümü ve 4 dönemlik eğilim grafiği tam tersini gösteriyor.',
  },
  {
    id: 'rumor-social',
    icon: '📱',
    source: 'Sosyal medya paylaşımı',
    text: 'Ağaçlar havadan su üretir; park fıskiyelerini ne kadar çok çalıştırırsak baraj o kadar çabuk dolar.',
    whyNotEvidence:
      'Bilimsel olarak yanlış: fıskiye suyu barajdan çekilir ve sıcakta buharlaşır. Paylaşımın ne kaynağı ne de ölçümü var.',
  },
  {
    id: 'rumor-neighbor',
    icon: '🗣️',
    source: 'Komşudan duyulan',
    text: 'Yan kasaba gizlice bizim barajdan su çekiyormuş; sorunun tek sebebi buymuş.',
    whyNotEvidence:
      'Kanıtı yok. Üstelik “tek sebep” iddiası defterindeki ölçülmüş kayıpları (boru kaçağı, tarım, park) görmezden geliyor.',
  },
] as const;

/** Bu öğrencinin masasına düşen iki söylenti — senaryo tohumuna göre sabit. */
export function rumorsFor(seed: string): RumorClaim[] {
  const skip = hash(seed, 'rumor') % RUMOR_CLAIMS.length;
  return RUMOR_CLAIMS.filter((_, i) => i !== skip);
}

export function isRumorId(id: string): boolean {
  return RUMOR_CLAIMS.some((r) => r.id === id);
}

export interface EvidenceCheckRecord {
  /** Masada gösterilen söylentiler. */
  shownRumorIds: string[];
  /** En az bir kez işaretlenen söylentiler (sonradan kaldırılsa bile). */
  rumorPicks: string[];
  /** Hiçbir söylentiyi işaretlemeden geçti mi? */
  filteredAll: boolean;
  completedAt: number;
}

// ===========================================================================
// 2. 15. GÜN KARŞI-HAMLESİ — ihmal edilen paydaşın hamlesi
// ===========================================================================

export type CrisisId = 'illegal-wells' | 'pipe-burst' | 'heat-wave' | 'neighbor-request';

/** Kriz anındaki stratejik tutum — betimleyici, iyi/kötü değil. */
export type CrisisStance = 'cooperative' | 'regulatory' | 'short-term' | 'structural';

export const STANCE_LABELS: Record<CrisisStance, string> = {
  cooperative: '🤝 İşbirliği / uzlaşma',
  regulatory: '📏 Kural koyma / denetim',
  'short-term': '⏱️ Hızlı, geçici çözüm',
  structural: '🏗️ Kalıcı, yapısal çözüm',
};

export interface CrisisOption {
  id: string;
  icon: string;
  title: string;
  text: string;
  /** Neye mal olur — ödünleşmenin açık yüzü. */
  cost: string;
  effects: StatChanges;
  stance: CrisisStance;
  /** Seçimden sonra Lina'nın düşündürücü yorumu (yargılamaz). */
  reflection: string;
}

export interface CrisisDef {
  id: CrisisId;
  icon: string;
  title: string;
  /** Hangi feragat bu hamleyi doğurdu — oyun teorisi bağlantısı. */
  cause: string;
  /** Sahada ne oluyor. */
  situation: string;
  /** Oyun teorisi çerçevesi, çocuk diliyle. */
  theory: string;
  options: readonly [CrisisOption, CrisisOption];
}

/**
 * Planın boş bıraktığı paydaş kendi çıkarına göre davranır. Öncelik sırası:
 * tarım (ortak kaynağı en hızlı tüketen hamle) → şebeke → park → (her şey
 * kapsandıysa) komşu kasabanın işbirliği talebi.
 */
export function crisisFor(picks: readonly string[], f: ScenarioFacts): CrisisDef {
  const has = (id: string) => picks.includes(id);

  if (!has('drip-irrigation')) {
    return {
      id: 'illegal-wells',
      icon: '🕳️',
      title: 'Tarlalarda Kaçak Kuyu Krizi',
      cause: 'Planda tarıma destek (damla sulama) yoktu.',
      situation: `Kanaldan gelen ${f.farmL} L/dk su sıcakta yetmeyince bazı çiftçiler ekinlerini kurtarmak için izinsiz artezyen kuyuları açmaya başladı. Her kuyu tek başına küçük ama hepsi aynı yeraltı suyunu çekiyor — barajı besleyen taban suyu düşüyor.`,
      theory:
        'Her çiftçi kendi tarlası için “bir kuyu bir şey olmaz” diye düşünüyor. Herkes böyle yapınca ortak su biter. Buna “ortak malların trajedisi” denir.',
      options: [
        {
          id: 'wells-quota',
          icon: '🤝',
          title: 'Ortak Kuyu Kotası + Geçici Tanker Desteği',
          text: 'Çiftçilerle masaya otur: kuyular kayıt altına alınsın, herkes günlük kotayla çeksin; belediye en zor günlerde tanker suyu göndersin.',
          cost: 'Bütçeden ek harcama, kotayı izlemek emek ister.',
          effects: { economy: -8, society: 5, water: 2, environment: 2 },
          stance: 'cooperative',
          reflection:
            'Kuralı çiftçilerle birlikte koydun. Birlikte konan kurala uymak daha kolaydır ama izlemek de gerekir.',
        },
        {
          id: 'wells-seal',
          icon: '📏',
          title: 'Kaçak Kuyuları Mühürle',
          text: 'Zabıta ekipleri izinsiz kuyuları hemen kapatsın; taban suyu korunsun.',
          cost: 'Çiftçilerin güveni sarsılır, bazı ekinler kuruyabilir.',
          effects: { water: 4, environment: 3, society: -8, economy: -3 },
          stance: 'regulatory',
          reflection:
            'Ortak suyu hızla korudun. Ama çiftçilerin sorunu çözülmedi — ihtiyaç sürerse yeni kuyular açılabilir.',
        },
      ],
    };
  }

  if (!has('repair-pipes')) {
    return {
      id: 'pipe-burst',
      icon: '💥',
      title: 'Çınar Caddesi’nde Boru Patladı',
      cause: 'Planda şebeke onarımı yoktu.',
      situation: `Eski borulardaki ${f.leakL} L/dk kaçak basıncı düzensizleştirdi ve Çınar Caddesi’nde ana boru patladı. Cadde su altında, iki mahallenin musluğu kurudu.`,
      theory:
        'Görünmeyen bir sorunu ertelemek bugün para kazandırır, ama fatura büyüyerek geri gelir. Buna “ertelemenin maliyeti” denir.',
      options: [
        {
          id: 'burst-repair',
          icon: '🏗️',
          title: 'Acil Onarım Ekibini Yedek Bütçeyle Gönder',
          text: 'Belediyenin ihtiyat parasıyla patlak hat bu hafta kalıcı olarak yenilensin.',
          cost: 'Yedek bütçe erir; başka acil durumda para kalmaz.',
          effects: { economy: -10, water: 4, society: 3 },
          stance: 'structural',
          reflection:
            'Sorunu kökünden çözdün ama yedek paranı harcadın. Bir sonraki sürpriz için ne kaldı?',
        },
        {
          id: 'burst-tanker',
          icon: '⏱️',
          title: 'Hattı Kapat, Mahalleye Tanker Gönder',
          text: 'Patlak hat kapatılsın, iki mahalleye onarım sırası gelene kadar tankerle su taşınsın.',
          cost: 'Mahalle günlerce kuyruğa girer, eski borular risk olmaya devam eder.',
          effects: { economy: -3, society: -7, water: 2 },
          stance: 'short-term',
          reflection:
            'Bütçeyi korudun ve kimse susuz kalmadı. Ama aynı borular başka bir yerde de patlayabilir.',
        },
      ],
    };
  }

  if (has('fountains-off') && !has('rain-harvest')) {
    return {
      id: 'heat-wave',
      icon: '🌡️',
      title: 'Sıcak Hava Dalgası: Meydanda Serinlik Talebi',
      cause: 'Park fıskiyeleri kapatıldı, yerine yedek kaynak (yağmur suyu) konmadı.',
      situation: `Sıcaklık rekor kırdı. Fıskiyeler kapalı olduğu için meydan kavruluyor; yaşlılar ve çocuklar serinleyecek yer arıyor, esnaf “müşteri gelmiyor” diye şikâyetçi. Park normalde ${f.parkL} L/dk su çekiyordu.`,
      theory:
        'Bir tasarruf, faydasını görmeyen gruba yük olabilir. Kazancı herkes paylaşır, bedelini bazıları öder — adil dağılım sorusu.',
      options: [
        {
          id: 'heat-evening',
          icon: '⏱️',
          title: 'Akşam Saatlerinde Kısa Süreli Serinleme Fıskiyesi',
          text: 'Fıskiyeler yalnızca akşam 1 saat açılsın; buharlaşma azken halk serinlesin.',
          cost: 'Tasarrufun bir kısmından vazgeçilir.',
          effects: { society: 6, water: -3 },
          stance: 'short-term',
          reflection:
            'İnsanları rahatlattın ve akşamı seçerek buharlaşmayı azalttın. Az suyla çok fayda — ama yine de su harcadın.',
        },
        {
          id: 'heat-shade',
          icon: '🏗️',
          title: 'Gölgelik + İçme Suyu İstasyonu Kur',
          text: 'Meydana gölgelik tenteler ve kontrollü içme suyu musluğu yapılsın; fıskiyeler kapalı kalsın.',
          cost: 'Bütçeden harcama, kurulum birkaç gün sürer.',
          effects: { economy: -5, society: 3, environment: 2 },
          stance: 'structural',
          reflection:
            'Suyu harcamadan serinlik sağlamanın başka bir yolunu buldun. Bazen sorun suyun kendisi değil, ihtiyacın nasıl karşılandığıdır.',
        },
      ],
    };
  }

  return {
    id: 'neighbor-request',
    icon: '🏘️',
    title: 'Yaylaköy’den Acil Su Talebi',
    cause: 'Planın kasabanın tüm paydaşlarını kapsadı — bu kez dışarıdan bir oyuncu geldi.',
    situation:
      'Komşu Yaylaköy’ün kaynağı kurudu. Muhtar, birkaç günlüğüne bizim şebekeden içme suyu istiyor. Geçen yıl biz zorlandığımızda onlar da bize tohum ve ekipman vermişti.',
    theory:
      'Bugün yardım edersen yarın yardım görebilirsin; reddedersen kendi suyunu korursun ama güven azalır. Tekrarlanan oyunlarda işbirliği uzun vadede kazandırabilir.',
    options: [
      {
        id: 'neighbor-share',
        icon: '🤝',
        title: 'Sınırlı Miktarda Su Paylaş',
        text: 'Yaylaköy’e yalnızca içme suyu için, süreli ve ölçülü tanker desteği verilsin.',
        cost: 'Kendi rezervinden bir miktar su verirsin.',
        effects: { water: -3, society: 4, economy: 2 },
        stance: 'cooperative',
        reflection:
          'Komşuna güven gösterdin. Ölçülü paylaştığın için kendi kasabanı da riske atmadın.',
      },
      {
        id: 'neighbor-decline',
        icon: '📏',
        title: 'Talebi Nazikçe Reddet',
        text: 'Kuraklık sürerken rezerv yalnızca kasaba için korunsun; Yaylaköy’e başka kaynak önerilsin.',
        cost: 'Komşuyla ilişki zayıflar, ileride yardım istemek zorlaşabilir.',
        effects: { water: 1, society: -3, economy: -1 },
        stance: 'regulatory',
        reflection:
          'Kendi kasabanın suyunu güvenceye aldın. Bir dahaki kriz senin başına gelirse komşun nasıl davranır sence?',
      },
    ],
  };
}

export interface CrisisRecord {
  crisisId: CrisisId;
  optionId: string;
  stance: CrisisStance;
  /** İlk plan mı, alternatif plan mı? */
  run: 'initial' | 'retry';
  /** Seçime kadar geçen süre (sn) — kararsızlık değil, düşünme süresi. */
  seconds: number;
  completedAt: number;
}

// ===========================================================================
// 3. KAVRAM ANAHTARLARI — kürsüde öz-ifade
// ===========================================================================

export interface ConceptTag {
  tag: string;
  /** Çipin altında görünen kısa yönlendirme — cümle değil, düşünme sorusu. */
  prompt: string;
}

export const CONCEPT_TAGS: readonly ConceptTag[] = [
  { tag: '#BoruKaçağı', prompt: 'Kaybolan su neden önemli?' },
  { tag: '#İçmeSuyuHakkı', prompt: 'Evler neden öncelikli/değil?' },
  { tag: '#GıdaGüvenliği', prompt: 'Tarlalar ne kazanır, ne kaybeder?' },
  { tag: '#BütçeDengesi', prompt: 'Para neden yetmedi?' },
  { tag: '#ParkFeragati', prompt: 'Parktan neden vazgeçtin/vazgeçmedin?' },
  { tag: '#UzunVade', prompt: 'Bu karar bir yıl sonra ne değiştirir?' },
  { tag: '#Kanıt', prompt: 'Hangi ölçüme dayandın?' },
] as const;

const TAG_RE = /#[\p{L}\p{N}_]+/gu;

/** Etiketleri ayıkla → yalnızca öğrencinin kendi kelimeleri kalır. */
export function stripConceptTags(text: string): string {
  return text.replace(TAG_RE, ' ').replace(/\s+/g, ' ').trim();
}

export function usedConceptTags(text: string): string[] {
  const known = new Set(CONCEPT_TAGS.map((c) => c.tag));
  return [...new Set(text.match(TAG_RE) ?? [])].filter((t) => known.has(t));
}

/** Öz-ifade eşiği: en az 3 kelime ve 15 karakterlik kendi cümlesi. */
export const MIN_OWN_CHARS = 15;
export const MIN_OWN_WORDS = 3;

export function ownWordsReady(text: string): boolean {
  const own = stripConceptTags(text);
  return own.length >= MIN_OWN_CHARS && own.split(' ').filter(Boolean).length >= MIN_OWN_WORDS;
}

export interface JustificationRecord {
  run: 'initial' | 'retry';
  conceptTags: string[];
  ownChars: number;
  ownWords: number;
  /** Mikrofonla en az bir kez dikte edildi mi? */
  dictated: boolean;
}

// ===========================================================================
// 4. ATÖLYE + GRAFİK OKURYAZARLIĞI İZLERİ
// ===========================================================================

export interface WorkshopInsight {
  id: MinigameId;
  icon: string;
  title: string;
  skill: string;
  lines: string[];
}

const AYLIN_DECISIONS: Record<string, string> = {
  patch: 'geçici yama (ucuz, hızlı ama kalıcı değil)',
  replace: 'kalıcı boru yenileme (pahalı ama kalıcı)',
  sensor: 'erken uyarı sensörü (önce ölç, sonra müdahale et)',
};

const num = (m: Record<string, number> | undefined, k: string): number | undefined =>
  m && typeof m[k] === 'number' ? m[k] : undefined;

/** Ham atölye sonuçlarını not vermeden betimleyici satırlara çevirir. */
export function workshopInsights(
  workshops: Partial<Record<MinigameId, MinigameResult>>,
): WorkshopInsight[] {
  const out: WorkshopInsight[] = [];

  const aylin = workshops.aylin;
  if (aylin) {
    const m = aylin.metrics;
    const lines: string[] = [];
    if (aylin.decisionId) lines.push(`Altyapı kararı: ${AYLIN_DECISIONS[aylin.decisionId] ?? aylin.decisionId}`);
    const saved = num(m, 'waterSaved');
    const cost = num(m, 'cost');
    if (saved !== undefined || cost !== undefined) {
      lines.push(
        `Tahmini geri kazanım ${saved ?? '—'} L/dk · maliyet ${cost !== undefined ? `₺${cost.toLocaleString('tr-TR')}` : '—'}`,
      );
    }
    out.push({
      id: 'aylin',
      icon: '🛠️',
      title: 'Mühendis Aylin · Baraj & Şebeke',
      skill: 'Maliyet–fayda tartarak altyapı kararı verme',
      lines,
    });
  }

  const nuri = workshops.nuri;
  if (nuri) {
    const m = nuri.metrics;
    const lines: string[] = [];
    const hyp = num(m, 'hypothesesCorrect');
    if (hyp !== undefined) lines.push(`Sızıntı yeri için kurduğu hipotezlerden ${hyp} tanesi doğrulandı`);
    const alerts = num(m, 'safetyAlerts');
    if (alerts !== undefined)
      lines.push(alerts === 0 ? 'Güvenlik adımlarını uyarı almadan izledi' : `Çalışırken ${alerts} güvenlik uyarısı aldı`);
    const radar = num(m, 'radarSeconds');
    if (radar) lines.push(`Sahada akustik radarla ${radar} sn arama yaptı`);
    out.push({
      id: 'nuri',
      icon: '🎧',
      title: 'Nuri Amca · Tesisat & Akustik Tespit',
      skill: 'Gözleme dayalı hipotez kurma ve test etme',
      lines,
    });
  }

  const kemal = workshops.kemal;
  if (kemal) {
    const m = kemal.metrics;
    const lines: string[] = [];
    const first = num(m, 'firstGuessCorrect');
    if (first !== undefined)
      lines.push(
        first === 1
          ? 'En az buharlaşan sulama saatini (sabah) ilk tahminde buldu'
          : 'En az buharlaşan sulama saatini deneyerek keşfetti',
      );
    const wrongH = num(m, 'wrongHourPicks');
    if (wrongH) lines.push(`${wrongH} kez yüksek buharlaşmalı saati denedi`);
    const rot = num(m, 'rotations');
    const extra = num(m, 'extraTurns');
    if (rot !== undefined)
      lines.push(`Fıskiyeleri ${rot} döndürmeyle yönlendirdi${extra ? ` (${extra} fazladan deneme)` : ' (fazladan deneme yok)'}`);
    out.push({
      id: 'kemal',
      icon: '⛲',
      title: 'İşçi Kemal · Akıllı Park',
      skill: 'Buharlaşma bilinci ve sulama zamanlaması',
      lines,
    });
  }

  const riza = workshops.riza;
  if (riza) {
    const m = riza.metrics;
    const lines: string[] = [];
    const hyp = num(m, 'hypothesisCorrect');
    if (hyp !== undefined)
      lines.push(hyp === 1 ? 'Su kaybının nedenine dair ilk hipotezi doğruydu' : 'Su kaybının nedenini deneme–gözlemle buldu');
    const over = num(m, 'overPressure');
    const moves = num(m, 'regulatorMoves');
    if (moves !== undefined)
      lines.push(`Basınç regülatörünü ${moves} ayarla dengeledi${over ? `, ${over} kez aşırı basınca çıktı` : ', aşırı basınca çıkmadı'}`);
    const wrongH = num(m, 'wrongHourPicks');
    if (wrongH !== undefined)
      lines.push(wrongH === 0 ? 'Sulama saatini ilk seferde uygun seçti' : `Sulama saatinde ${wrongH} kez sıcak saati denedi`);
    out.push({
      id: 'riza',
      icon: '🌾',
      title: 'Çiftçi Rıza · Damla Sulama',
      skill: 'Basınç dengesi ve verimli sulama',
      lines,
    });
  }

  return out;
}

/** Grafik sorularındaki yanlış seçeneklerin işaret ettiği okuma yanılgıları. */
export const GRAPH_MISCONCEPTIONS: Record<string, string> = {
  'bar-scale': 'Çubuğun boyunu yanlış ölçekle okudu (küçük gördü)',
  'category-swap': 'Grafikteki kategorileri karıştırdı',
  'trend-direction': 'Eğrinin yönünü/hızını ters yorumladı (hızlanmayı yavaşlama sandı)',
  'static-reading': 'Değişimi görmeden tek bir değere baktı',
  'difference-calc': 'İki sütun arasındaki farkı hesaplarken hata yaptı',
  'before-after': 'Önce–sonra karşılaştırmasını yapmadı',
};

export interface DataLiteracyLine {
  icon: string;
  text: string;
}

export function dataLiteracyLines(
  quizzes: readonly {
    mode: 'evidence' | 'debrief';
    wrongAttempts: number;
    firstTryCorrect?: number;
    misconceptions?: string[];
  }[],
  evidence?: EvidenceCheckRecord,
): DataLiteracyLine[] {
  const lines: DataLiteracyLine[] = [];
  for (const q of quizzes) {
    const where = q.mode === 'evidence' ? 'Kanıt masası grafikleri' : '30. gün etki grafikleri';
    const first =
      q.firstTryCorrect !== undefined ? ` · ilk denemede ${q.firstTryCorrect}/2 doğru` : '';
    lines.push({
      icon: q.mode === 'evidence' ? '📊' : '📈',
      text:
        q.wrongAttempts === 0
          ? `${where}: iki soruyu da ilk seferde doğru yorumladı`
          : `${where}: doğru yoruma ${q.wrongAttempts} ek denemeyle ulaştı${first}`,
    });
    for (const id of q.misconceptions ?? []) {
      const label = GRAPH_MISCONCEPTIONS[id];
      if (label) lines.push({ icon: '🔍', text: `Gözlenen okuma yanılgısı: ${label}` });
    }
  }
  if (evidence) {
    lines.push(
      evidence.filteredAll
        ? { icon: '🛡️', text: 'Kanıt masasındaki söylentileri ölçüm verisinden ayırdı, hiçbirini rapora almadı' }
        : {
            icon: '🧭',
            text: `${evidence.rumorPicks.length} söylentiyi önce kanıt sandı; açıklamayı okuyunca rapordan çıkardı`,
          },
    );
  }
  return lines;
}
