/**
 * Atlas Pedagogical AI Client & Local Deterministic Fallback Engine.
 *
 * Bridges the student's live deterministic town simulation (`ScenarioFacts`)
 * and gameplay telemetry (`GameSession`) with the `/api/ai/*` endpoints
 * powered by Gemini (`gemini-4-hydrogen`).
 *
 * Designed with offline-first graceful degradation: if the school network is
 * offline or running in standalone Vite dev mode, the local pedagogical engine
 * produces the exact same structured schemas grounded in the student's town
 * numbers.
 */

import type { GameSession, QuestStage } from '../data/session';
import { SOLUTION_CARDS } from '../data/story';
import type { ScenarioFacts } from '../scenario/model';

export type ThinkingLevel = 'BASLANGIC' | 'GELISEN' | 'GUCLU';
export type EvidenceLevel = 'SEZGISEL' | 'GOZLEMSEL' | 'KANITA_DAYALI';

export interface RationaleAnalysisResult {
  systemic_thinking: {
    level: ThinkingLevel;
    rationale: string;
  };
  trade_off_awareness: {
    acknowledged: boolean;
    sacrificed_axis: string;
    rationale: string;
  };
  evidence_grounding: {
    level: EvidenceLevel;
    referenced_clues: string[];
  };
  stakeholder_empathy: {
    primary_focus: string;
    empathy_note: string;
  };
  constructive_feedback: string;
}

export interface PedagogicalReportResult {
  thinking_style_title: string;
  parent_summary: string;
  dinner_table_question: string;
  teacher_summary: string;
  classroom_discussion_prompt: string;
  strengths: string[];
}

export interface GuideChatTurn {
  q: string;
  a: string;
  socraticQuestion: string;
  suggestedDistrict: string;
  at: number;
  stage: QuestStage;
}

export interface GuideChatResponse {
  reply: string;
  socratic_question: string;
  suggested_district: string;
}

/** Max Socratic questions per quest stage so the child stays inside gameplay. */
export const MAX_QUESTIONS_PER_STAGE = 3;

function resolveAiEndpoint(subpath: string): string {
  const envBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '');
  if (envBase && envBase.startsWith('http')) {
    return `${envBase}/ai/${subpath}`;
  }
  return `/api/ai/${subpath}`;
}

async function postAi<T>(subpath: string, payload: Record<string, unknown>): Promise<T | null> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(resolveAiEndpoint(subpath), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// 1. Open-Ended Justification Analysis
// ---------------------------------------------------------------------------

export function localAnalyzeRationale(input: {
  rationale: string;
  solutionIds: string[];
}): RationaleAnalysisResult {
  const text = input.rationale.toLowerCase();
  const solutions = input.solutionIds;

  const mentionsLeak = /kaçak|boru|sızıntı|nuri|asfalt|kayıp/.test(text);
  const mentionsFarm = /tarla|çiftçi|rıza|damla|ekin|gıda|tarım|sebze/.test(text);
  const mentionsPark = /park|fıskiye|kemal|yeşil|çiçek|süs/.test(text);
  const mentionsHomes = /ev|içme|mahalle|insan|halk|susuz|yaşam/.test(text);
  const mentionsBudget = /bütçe|para|maliyet|ucuz|pahalı|tasarruf|ekonomi/.test(text);
  const mentionsTradeoff = /ama|fakat|rağmen|yerine|feda|vazgeç|öncelik|daha önemli/.test(text);

  const axesCount = [
    mentionsLeak,
    mentionsFarm,
    mentionsPark,
    mentionsHomes,
    mentionsBudget,
  ].filter(Boolean).length;

  const sysLevel: ThinkingLevel =
    axesCount >= 3 ? 'GUCLU' : axesCount >= 2 ? 'GELISEN' : 'BASLANGIC';

  const referencedClues: string[] = [];
  if (mentionsLeak || solutions.includes('repair-pipes')) {
    referencedClues.push('Şebeke su kaçağı verisi');
  }
  if (mentionsFarm || solutions.includes('drip-irrigation')) {
    referencedClues.push('Tarımsal sulama ihtiyacı');
  }
  if (mentionsPark || solutions.includes('fountains-off')) {
    referencedClues.push('Park fıskiye tüketimi');
  }
  if (mentionsHomes || solutions.includes('saving-campaign')) {
    referencedClues.push('Konut içme suyu güvenliği');
  }

  let primaryFocus = 'Kasaba Geneli Denge';
  if (mentionsHomes && !mentionsFarm) primaryFocus = 'Mahalle Sakinleri ve İçme Suyu';
  else if (mentionsFarm && !mentionsHomes) primaryFocus = 'Tarımsal Üretim ve Çiftçiler';
  else if (mentionsLeak) primaryFocus = 'Altyapı ve Su Kaybını Önleme';

  const sacrificedAxis = mentionsTradeoff
    ? mentionsPark
      ? 'Park estetiği ve süs fıskiyeleri'
      : mentionsBudget
        ? 'Kısa vadeli bütçe esnekliği'
        : 'İkincil su tüketim alanları'
    : solutions.includes('fountains-off')
      ? 'Park fıskiyeleri'
      : 'Belirtilmedi';

  const evidenceLevel: EvidenceLevel =
    referencedClues.length >= 2
      ? 'KANITA_DAYALI'
      : referencedClues.length === 1
        ? 'GOZLEMSEL'
        : 'SEZGISEL';

  return {
    systemic_thinking: {
      level: sysLevel,
      rationale:
        sysLevel === 'GUCLU'
          ? 'Öğrenci su kaynağı, altyapı ve farklı paydaşların ihtiyaçları arasındaki çoklu nedensel bağı kurdu.'
          : sysLevel === 'GELISEN'
            ? 'Öğrenci kararını en az iki kasaba faktörüyle ilişkilendirerek açıkladı.'
            : 'Öğrenci kararını doğrudan tek bir ana hedef üzerinden ifade etti.',
    },
    trade_off_awareness: {
      acknowledged: mentionsTradeoff || solutions.includes('fountains-off'),
      sacrificed_axis: sacrificedAxis,
      rationale: mentionsTradeoff
        ? 'Karar cümlesinde sınırlı kaynaklar nedeniyle bir alanı önceliklendirirken diğerinden ödün verdiğini açıkça belirtti.'
        : 'Seçilen paket bütçe kısıtı içinde önceliklendirme içeriyor.',
    },
    evidence_grounding: {
      level: evidenceLevel,
      referenced_clues:
        referencedClues.length > 0 ? referencedClues : ['Genel su krizi gözlemi'],
    },
    stakeholder_empathy: {
      primary_focus: primaryFocus,
      empathy_note: `${primaryFocus} ekseninde kasabalıların günlük yaşamını koruma motivasyonu öne çıkıyor.`,
    },
    constructive_feedback:
      'Gerekçende kasabanın su geleceğini korumak için kurduğun mantık çok değerli! Şimdi bu kararın 30 gün sonra bölgeleri nasıl dönüştüreceğini gözlemleyelim.',
  };
}

export async function analyzeStudentRationale(input: {
  rationale: string;
  solutionIds: string[];
  totalCost: number;
  facts: ScenarioFacts;
  mode?: 'initial' | 'retry';
}): Promise<RationaleAnalysisResult> {
  const remote = await postAi<RationaleAnalysisResult>('analyze-rationale', {
    rationale: input.rationale,
    solutionIds: input.solutionIds,
    totalCost: input.totalCost,
    facts: input.facts,
    mode: input.mode ?? 'initial',
  });
  if (remote && remote.systemic_thinking && remote.stakeholder_empathy) {
    return remote;
  }
  return localAnalyzeRationale(input);
}

// ---------------------------------------------------------------------------
// 2. Personalized Pedagogical Report (Parent & Teacher)
// ---------------------------------------------------------------------------

export type ReportSessionInput = {
  plan?: { solutionIds: string[]; totalCost: number; rationale?: string } | null;
  altPlan?: { solutionIds: string[]; totalCost: number; rationale?: string } | null;
  kadim?: GameSession['kadim'];
  notebook?: { cardId: string; icon: string; text: string; datum?: string }[];
  aiProfile?: GameSession['aiProfile'];
  finalStatement?: string;
  quest?: string;
};

export function localGeneratePedagogicalReport(
  session: ReportSessionInput,
): PedagogicalReportResult {
  const plan = session.plan;
  const altPlan = session.altPlan;
  const kadim = session.kadim;
  const notebookCount = session.notebook?.length ?? 0;
  const rationaleAnalysis = session.aiProfile?.rationaleAnalysis;

  const solutions = plan?.solutionIds ?? [];
  const repairedLeak = solutions.includes('repair-pipes');
  const helpedFarm = solutions.includes('drip-irrigation');
  const triedAlt = Boolean(altPlan && altPlan.solutionIds.length > 0);

  let styleTitle = 'Dengeli Sistem Gözlemcisi';
  if (repairedLeak && helpedFarm) styleTitle = 'Altyapı ve Üretim Dengeleyicisi';
  else if (repairedLeak) styleTitle = 'Kanıt Odaklı Sorun Çözücü';
  else if (helpedFarm) styleTitle = 'Üretim ve Ekosistem Koruyucusu';

  const strengths: string[] = [];
  if (notebookCount >= 4) {
    strengths.push('Tüm kasaba bölgelerini dinleyerek çok yönlü kanıt toplama');
  } else if (notebookCount > 0) {
    strengths.push('Karar öncesi saha gözlemi yapma');
  }
  if (kadim?.solved) {
    strengths.push(
      kadim.hints === 0
        ? "Kadim Uyum Haritası'nda ipucu kullanmadan sistem bağlantılarını çözme"
        : 'Bölgeler arası su akış bağlantılarını haritalama',
    );
  }
  if (repairedLeak) {
    strengths.push('Görünmeyen altyapı kayıplarını veriye dayanarak önceliklendirme');
  }
  if (triedAlt) {
    strengths.push('30 günlük sonuçları gördükten sonra alternatif strateji deneme esnekliği');
  }
  if (strengths.length === 0) {
    strengths.push('Sınırlı kaynaklarla karar alma sürecine katılım');
  }

  const pickedTitles = solutions
    .map((id) => SOLUTION_CARDS.find((c) => c.id === id)?.title ?? id)
    .join(', ');
  const rationaleQuote = plan?.rationale ? ` ("${plan.rationale}")` : '';

  return {
    thinking_style_title: styleTitle,
    parent_summary: `Çocuğunuz Denge Kasabası'ndaki su krizini yönetirken ${notebookCount} farklı bölgeden bilgi topladı ve sınırlı bütçesini ${
      pickedTitles ? `(${pickedTitles}) ` : ''
    }${
      repairedLeak
        ? 'öncelikle şebekedeki su kaybını önlemeye'
        : 'kasabalıların günlük su ihtiyacını dengelemeye'
    } yönlendirdi${rationaleQuote}. ${
      triedAlt
        ? 'Üstelik ilk planın 30 günlük sonuçlarını inceledikten sonra yeni bir alternatif plan deneyerek bilimsel esneklik gösterdi.'
        : 'Kararlarının kasaba üzerindeki etkilerini adım adım takip etti.'
    }`,
    dinner_table_question:
      'Bugün yönettiğin kasabada suyu kurtarmak için hangi zor kararı verdin; bir şeyi korurken neyden vazgeçmek zorunda kaldın?',
    teacher_summary: `Öğrenci, kanıt toplama aşamasında ${notebookCount} bulgu kaydetti${
      kadim
        ? ` ve Kadim sistem bulmacasını ${kadim.placeTries} denemede tamamladı (öz-güven: ${kadim.confidence}/5)`
        : ''
    }. ${
      rationaleAnalysis
        ? `Gerekçelendirme analizinde '${rationaleAnalysis.systemic_thinking.level}' düzeyde sistem düşüncesi ve '${rationaleAnalysis.stakeholder_empathy.primary_focus}' odağı gözlemlendi.`
        : 'Karar paketinde bütçe ve su tasarrufu dengesini kurguladı.'
    } ${triedAlt ? 'İkinci bölümde geri bildirimlere dayalı plan revizyonu gerçekleştirdi.' : ''}`,
    classroom_discussion_prompt:
      "Sınıfta 'Görünmeyen altyapı sorunlarına mı (patlak borular) yoksa görünür tasarruf önlemlerine mi (fıskiyeler) önce bütçe ayrılmalı?' tartışmasında deneyimini paylaşmaya davet edilebilir.",
    strengths,
  };
}

export async function generatePedagogicalReport(
  session: ReportSessionInput,
  facts?: ScenarioFacts,
): Promise<PedagogicalReportResult> {
  const remote = await postAi<PedagogicalReportResult>('generate-report', {
    session,
    facts,
  });
  if (remote && remote.parent_summary && remote.teacher_summary) {
    return remote;
  }
  return localGeneratePedagogicalReport(session);
}

// ---------------------------------------------------------------------------
// 3. Dynamic Simulation RAG Guide (Lina Socratic Assistant)
// ---------------------------------------------------------------------------

export function localAskLinaGuide(input: {
  question: string;
  facts: ScenarioFacts;
  quest: QuestStage;
}): GuideChatResponse {
  const q = input.question.toLowerCase();
  const f = input.facts;

  if (/baraj|rezerv|aylin|su ne kadar|seviye/.test(q)) {
    return {
      reply: `Şu an kasabamızın baraj doluluk oranı %${f.reservoirPct} seviyesinde ve barajdan dakikada ${f.outflowL} litre su çıkıyor. Mühendis Aylin kritik eşiğin %${f.criticalPct} olduğunu söylüyor.`,
      socratic_question: `Barajdan çıkan ${f.outflowL} L/dk suyun tamamı evlere ulaşıyor mu, yoksa yolda kaybolan bir kısım var mı dersin?`,
      suggested_district: 'Kuzey · Baraj ve Rezervuar (Mühendis Aylin)',
    };
  }

  if (/kaçak|boru|nuri|mahalle|ev|sızıntı/.test(q)) {
    return {
      reply: `Çınar Caddesi'nde Nuri Amca'nın bahsettiği eski borulardan dakikada tam ${f.leakL} litre (yani şebeke suyunun %${f.leakPct}'i) toprağa karışıp kayboluyor!`,
      socratic_question: `Eğer bu boru kaçağını onarırsak yüksek bir bütçe harcayacağız ama her dakika ${f.leakL} litre temiz suyu kurtaracağız. Sence buna değer mi?`,
      suggested_district: 'Doğu · Konut Bölgesi (Nuri Amca)',
    };
  }

  if (/tarla|çiftçi|rıza|tarım|damla|ekin|sebze/.test(q)) {
    return {
      reply: `Çiftçi Rıza'nın tarlaları kendi kanalından dakikada ${f.farmL} litre su çekiyor. Açık kanaldan salma sulama yapıldığında suyun önemli bir kısmı buharlaşıyor.`,
      socratic_question: `Tarlaların suyunu tamamen kesmek yerine damla sulamaya geçersek hem ürünleri koruyup hem suyu azaltabilir miyiz?`,
      suggested_district: 'Batı · Tarım Vadisi (Çiftçi Rıza)',
    };
  }

  if (/park|kemal|fıskiye|yeşil/.test(q)) {
    return {
      reply: `Merkez Park dakikada ${f.parkL} litre su kullanıyor ve bunun bir kısmı öğle sıcağında çalışan süs fıskiyelerine gidiyor.`,
      socratic_question: `Kuraklık sırasında süs fıskiyelerini kapatmak bütçeden hiç para harcamadan su kazandırır; peki park sakinleri buna nasıl tepki verir?`,
      suggested_district: 'Merkez · Kasaba Parkı (İşçi Kemal)',
    };
  }

  if (/bütçe|para|toplantı|başkan|ne seç|hangisi/.test(q)) {
    return {
      reply: `Belediye Başkanımız toplam 1.000.000 ₺ bütçe ayırdı. Tüm çözümleri aynı anda alacak paramız yok, bu yüzden en etkili kombinasyonu kurmalıyız.`,
      socratic_question: `Defterindeki kanıtlara baktığında kasabada en büyük su kaybı nerede yaşanıyor ve hangi iki-üç çözüm birbirini tamamlar?`,
      suggested_district: 'Güney · Belediye Binası (Başkan Adil)',
    };
  }

  return {
    reply: `Kasabamızda şu an rezervuar %${f.reservoirPct} dolulukta, şebekeden çıkan ${f.outflowL} L/dk suyun ${f.leakL} L/dk kadarı eski borulardan sızıyor ve tarım kanalı ${f.farmL} L/dk su çekiyor.`,
    socratic_question: `Baraj, Tarım, Konut ve Park bölgelerinden hangisinin verisi seni daha çok düşündürdü?`,
    suggested_district: 'Merkez Park veya henüz gezmediğin bir bölge',
  };
}

export async function askLinaGuide(input: {
  question: string;
  facts: ScenarioFacts;
  quest: QuestStage;
  completedCards: string[];
  plan?: { solutionIds: string[]; totalCost: number } | null;
  history?: GuideChatTurn[];
}): Promise<GuideChatResponse> {
  const remote = await postAi<GuideChatResponse>('guide-chat', {
    question: input.question,
    facts: input.facts,
    quest: input.quest,
    completedCards: input.completedCards,
    plan: input.plan,
    history: input.history,
  });
  if (remote && remote.reply && remote.socratic_question) {
    return remote;
  }
  return localAskLinaGuide(input);
}
