/**
 * Atlas Pedagogical AI Engine — Serverless handler for:
 *  - POST /ai/analyze-rationale : Open-ended student justification -> structured pedagogical profile
 *  - POST /ai/generate-report   : Student telemetry & decision trace -> Parent & Teacher narrative insights
 *  - POST /ai/guide-chat        : Dynamic Simulation RAG (Lina Socratic guide grounded in student's town facts)
 *
 * Uses the Gemini Interactions API (`gemini-4-hydrogen`) with JSON Schema `response_format`
 * when GEMINI_API_KEY / GOOGLE_API_KEY is present, and degrades gracefully to a deterministic
 * pedagogical rules engine when offline or unconfigured.
 */

const GEMINI_MODEL = "gemini-4-hydrogen";
const INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

const SOLUTION_NAMES = {
  "fountains-off": "Park Fıskiyelerini Kapatma",
  "saving-campaign": "Evlerde Su Tasarrufu Kampanyası",
  "repair-pipes": "Ana Boru Hattı Kaçak Onarımı",
  "drip-irrigation": "Tarımda Damla Sulama Sistemi",
  "rain-harvest": "Yağmur Suyu Hasadı Depoları",
};

/** Read and parse JSON body from Node IncomingMessage. */
async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.trim()) {
    return JSON.parse(req.body);
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

/**
 * Call Gemini Interactions API with structured JSON output.
 * Returns parsed JSON object or null if key is missing / request fails.
 */
async function callGeminiInteraction({ systemInstruction, input, schema, maxOutputTokens = 700 }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const requestBody = {
      model: GEMINI_MODEL,
      system_instruction: systemInstruction,
      input,
      generation_config: {
        max_output_tokens: maxOutputTokens,
      },
      store: false,
    };

    if (schema) {
      requestBody.response_format = {
        type: "text",
        mime_type: "application/json",
        schema,
      };
    }

    const res = await fetch(INTERACTIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
        "Api-Revision": "2026-05-20",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    // Extract text from trailing model_output steps
    let outputText = typeof data.output_text === "string" ? data.output_text : "";
    if (!outputText && Array.isArray(data.steps)) {
      const textParts = [];
      for (const step of data.steps) {
        if (step.type === "model_output" && Array.isArray(step.content)) {
          for (const part of step.content) {
            if (part.type === "text" && typeof part.text === "string") {
              textParts.push(part.text);
            }
          }
        }
      }
      outputText = textParts.join("");
    }

    if (!outputText) return null;
    return schema ? JSON.parse(outputText) : { text: outputText };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// 1. Open-Ended Justification Analysis (/ai/analyze-rationale)
// ---------------------------------------------------------------------------

const RATIONALE_SCHEMA = {
  type: "object",
  properties: {
    systemic_thinking: {
      type: "object",
      properties: {
        level: { type: "string", enum: ["BASLANGIC", "GELISEN", "GUCLU"] },
        rationale: { type: "string" },
      },
      required: ["level", "rationale"],
    },
    trade_off_awareness: {
      type: "object",
      properties: {
        acknowledged: { type: "boolean" },
        sacrificed_axis: { type: "string" },
        rationale: { type: "string" },
      },
      required: ["acknowledged", "sacrificed_axis", "rationale"],
    },
    evidence_grounding: {
      type: "object",
      properties: {
        level: { type: "string", enum: ["SEZGISEL", "GOZLEMSEL", "KANITA_DAYALI"] },
        referenced_clues: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["level", "referenced_clues"],
    },
    stakeholder_empathy: {
      type: "object",
      properties: {
        primary_focus: { type: "string" },
        empathy_note: { type: "string" },
      },
      required: ["primary_focus", "empathy_note"],
    },
    constructive_feedback: { type: "string" },
  },
  required: [
    "systemic_thinking",
    "trade_off_awareness",
    "evidence_grounding",
    "stakeholder_empathy",
    "constructive_feedback",
  ],
};

function fallbackAnalyzeRationale(payload) {
  const text = String(payload?.rationale ?? "").toLowerCase();
  const solutions = Array.isArray(payload?.solutionIds) ? payload.solutionIds : [];

  const mentionsLeak = /kaçak|boru|sızıntı|nuri|asfalt|kayıp/.test(text);
  const mentionsFarm = /tarla|çiftçi|rıza|damla|ekin|gıda|tarım|sebze/.test(text);
  const mentionsPark = /park|fıskiye|kemal|yeşil|çiçek|süs/.test(text);
  const mentionsHomes = /ev|içme|mahalle|insan|halk|susuz|yaşam/.test(text);
  const mentionsBudget = /bütçe|para|maliyet|ucuz|pahalı|tasarruf|ekonomi/.test(text);
  const mentionsTradeoff = /ama|fakat|rağmen|yerine|feda|vazgeç|öncelik|daha önemli/.test(text);

  const axesCount = [mentionsLeak, mentionsFarm, mentionsPark, mentionsHomes, mentionsBudget].filter(Boolean).length;
  const sysLevel = axesCount >= 3 ? "GUCLU" : axesCount >= 2 ? "GELISEN" : "BASLANGIC";

  const referencedClues = [];
  if (mentionsLeak || solutions.includes("repair-pipes")) referencedClues.push("Şebeke su kaçağı verisi");
  if (mentionsFarm || solutions.includes("drip-irrigation")) referencedClues.push("Tarımsal sulama ihtiyacı");
  if (mentionsPark || solutions.includes("fountains-off")) referencedClues.push("Park fıskiye tüketimi");
  if (mentionsHomes || solutions.includes("saving-campaign")) referencedClues.push("Konut içme suyu güvenliği");

  let primaryFocus = "Kasaba Geneli Denge";
  if (mentionsHomes && !mentionsFarm) primaryFocus = "Mahalle Sakinleri ve İçme Suyu";
  else if (mentionsFarm && !mentionsHomes) primaryFocus = "Tarımsal Üretim ve Çiftçiler";
  else if (mentionsLeak) primaryFocus = "Altyapı ve Su Kaybını Önleme";

  const sacrificedAxis = mentionsTradeoff
    ? mentionsPark
      ? "Park estetiği ve süs fıskiyeleri"
      : mentionsBudget
        ? "Kısa vadeli bütçe esnekliği"
        : "İkincil su tüketim alanları"
    : solutions.includes("fountains-off")
      ? "Park fıskiyeleri"
      : "Belirtilmedi";

  return {
    systemic_thinking: {
      level: sysLevel,
      rationale:
        sysLevel === "GUCLU"
          ? "Öğrenci su kaynağı, altyapı ve farklı paydaşların ihtiyaçları arasındaki çoklu nedensel bağı kurdu."
          : sysLevel === "GELISEN"
            ? "Öğrenci kararını en az iki kasaba faktörüyle ilişkilendirerek açıkladı."
            : "Öğrenci kararını doğrudan tek bir ana hedef üzerinden ifade etti.",
    },
    trade_off_awareness: {
      acknowledged: mentionsTradeoff || solutions.includes("fountains-off"),
      sacrificed_axis: sacrificedAxis,
      rationale: mentionsTradeoff
        ? "Karar cümlesinde sınırlı kaynaklar nedeniyle bir alanı önceliklendirirken diğerinden ödün verdiğini açıkça belirtti."
        : "Seçilen paket bütçe kısıtı içinde önceliklendirme içeriyor.",
    },
    evidence_grounding: {
      level: referencedClues.length >= 2 ? "KANITA_DAYALI" : referencedClues.length === 1 ? "GOZLEMSEL" : "SEZGISEL",
      referenced_clues: referencedClues.length > 0 ? referencedClues : ["Genel su krizi gözlemi"],
    },
    stakeholder_empathy: {
      primary_focus: primaryFocus,
      empathy_note: `${primaryFocus} ekseninde kasabalıların günlük yaşamını koruma motivasyonu öne çıkıyor.`,
    },
    constructive_feedback:
      "Gerekçende kasabanın su geleceğini korumak için kurduğun mantık çok değerli! Bir sonraki adımda bu kararın 30 gün sonra diğer bölgeleri nasıl etkileyeceğini gözlemleyelim.",
  };
}

async function handleAnalyzeRationale(body) {
  const rationale = String(body?.rationale ?? "").trim();
  const solutionIds = Array.isArray(body?.solutionIds) ? body.solutionIds : [];
  const totalCost = Number(body?.totalCost ?? 0);
  const facts = body?.facts ?? {};
  const mode = body?.mode === "retry" ? "Alternatif Plan (2. Deneme)" : "İlk Plan";

  if (!rationale) {
    return fallbackAnalyzeRationale(body);
  }

  const pickedNames = solutionIds.map((id) => SOLUTION_NAMES[id] || id).join(", ");
  const systemInstruction = `Sen Atlas Learning 'Denge Kasabası' (10-12 yaş) eğitimsel simülasyonunun Pedagojik Karar Analiz Motorusun.
Görevin: Öğrencinin su krizi karşısında seçtiği çözüm paketini ve kendi cümleleriyle yazdığı gerekçeyi analiz etmektir.
KESİN KURALLAR:
- Asla not verme, yargılama veya 'yanlış yaptın' deme.
- Öğrencinin düşünce yapısını (sistem düşüncesi, ödünleşme/vazgeçiş farkındalığı, kanıta dayandırma ve paydaş empatisi) Türkçe olarak sınıflandır.
- constructive_feedback alanında doğrudan öğrenciye hitap eden (2. tekil şahıs), sıcak, merak uyandırıcı 1-2 cümlelik geri bildirim ver.`;

  const input = `Aşama: ${mode}
Kasaba Verileri: Baraj doluluğu %${facts.reservoirPct ?? 40}, Şebeke çıkışı ${facts.outflowL ?? 180} L/dk, Boru kaçağı ${facts.leakL ?? 45} L/dk (%${facts.leakPct ?? 25}), Tarım kanalı ${facts.farmL ?? 110} L/dk.
Seçilen Çözümler: ${pickedNames || "Belirtilmedi"} (Toplam: ${totalCost} TL)
Öğrencinin Açık Uçlu Gerekçesi: "${rationale}"`;

  const llmResult = await callGeminiInteraction({
    systemInstruction,
    input,
    schema: RATIONALE_SCHEMA,
    maxOutputTokens: 600,
  });

  return llmResult ?? fallbackAnalyzeRationale(body);
}

// ---------------------------------------------------------------------------
// 2. Personalized Pedagogical AI Report (/ai/generate-report)
// ---------------------------------------------------------------------------

const REPORT_SCHEMA = {
  type: "object",
  properties: {
    thinking_style_title: { type: "string" },
    parent_summary: { type: "string" },
    dinner_table_question: { type: "string" },
    teacher_summary: { type: "string" },
    classroom_discussion_prompt: { type: "string" },
    strengths: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "thinking_style_title",
    "parent_summary",
    "dinner_table_question",
    "teacher_summary",
    "classroom_discussion_prompt",
    "strengths",
  ],
};

function fallbackGenerateReport(body) {
  const session = body?.session ?? {};
  const plan = session?.plan;
  const altPlan = session?.altPlan;
  const kadim = session?.kadim;
  const notebookCount = Array.isArray(session?.notebook) ? session.notebook.length : 0;
  const rationaleAnalysis = session?.aiProfile?.rationaleAnalysis;

  const solutions = plan?.solutionIds ?? [];
  const repairedLeak = solutions.includes("repair-pipes");
  const helpedFarm = solutions.includes("drip-irrigation");
  const triedAlt = Boolean(altPlan && Array.isArray(altPlan.solutionIds) && altPlan.solutionIds.length > 0);

  let styleTitle = "Dengeli Sistem Gözlemcisi";
  if (repairedLeak && helpedFarm) styleTitle = "Altyapı ve Üretim Dengeleyicisi";
  else if (repairedLeak) styleTitle = "Kanıt Odaklı Sorun Çözücü";
  else if (helpedFarm) styleTitle = "Üretim ve Ekosistem Koruyucusu";

  const strengths = [];
  if (notebookCount >= 4) strengths.push("Tüm kasaba bölgelerini dinleyerek çok yönlü kanıt toplama");
  else if (notebookCount > 0) strengths.push("Karar öncesi saha gözlemi yapma");
  if (kadim?.solved) {
    strengths.push(
      kadim.hints === 0
        ? "Kadim Uyum Haritası'nda ipucu kullanmadan sistem bağlantılarını çözme"
        : "Bölgeler arası su akış bağlantılarını haritalama",
    );
  }
  if (repairedLeak) strengths.push("Görünmeyen altyapı kayıplarını veriye dayanarak önceliklendirme");
  if (triedAlt) strengths.push("30 günlük sonuçları gördükten sonra alternatif strateji deneme esnekliği");
  if (strengths.length === 0) strengths.push("Sınırlı kaynaklarla karar alma sürecine katılım");

  const rationaleQuote = plan?.rationale ? ` ("${plan.rationale}")` : "";

  return {
    thinking_style_title: styleTitle,
    parent_summary: `Çocuğunuz Denge Kasabası'ndaki su krizini yönetirken ${notebookCount} farklı bölgeden bilgi topladı ve sınırlı bütçesini ${repairedLeak ? "öncelikle şebekedeki su kaybını önlemeye" : "kasabalıların günlük su ihtiyacını dengelemeye"} yönlendirdi${rationaleQuote}. ${triedAlt ? "Üstelik ilk planın 30 günlük sonuçlarını inceledikten sonra yeni bir alternatif plan deneyerek bilimsel esneklik gösterdi." : "Kararlarının kasaba üzerindeki etkilerini adım adım takip etti."}`,
    dinner_table_question:
      "Bugün yönettiğin kasabada suyu kurtarmak için hangi zor kararı verdin; bir şeyi korurken neyden vazgeçmek zorunda kaldın?",
    teacher_summary: `Öğrenci, kanıt toplama aşamasında ${notebookCount} bulgu kaydetti${kadim ? ` ve Kadim sistem bulmacasını ${kadim.placeTries} denemede tamamladı (güven düzeyi: ${kadim.confidence}/5)` : ""}. ${rationaleAnalysis ? `Gerekçelendirme analizinde '${rationaleAnalysis.systemic_thinking?.level}' düzeyde sistem düşüncesi ve '${rationaleAnalysis.stakeholder_empathy?.primary_focus}' odağı gözlemlendi.` : "Karar paketinde bütçe ve su tasarrufu dengesini kurguladı."} ${triedAlt ? "İkinci bölümde geri bildirimlere dayalı plan revizyonu gerçekleştirdi." : ""}`,
    classroom_discussion_prompt:
      "Sınıfta 'Görünmeyen altyapı sorunlarına mı (patlak borular) yoksa görünür tasarruf önlemlerine mi (fıskiyeler) önce bütçe ayrılmalı?' tartışmasında deneyimini paylaşmaya davet edilebilir.",
    strengths,
  };
}

async function handleGenerateReport(body) {
  const session = body?.session ?? {};
  const facts = body?.facts ?? {};
  const plan = session?.plan;
  const altPlan = session?.altPlan;
  const kadim = session?.kadim;
  const notebook = Array.isArray(session?.notebook) ? session.notebook : [];
  const rationaleAnalysis = session?.aiProfile?.rationaleAnalysis;

  const systemInstruction = `Sen Atlas Learning Pedagojik Raporlama Motorusun.
10-12 yaş grubundaki bir öğrencinin 'Denge Kasabası: Su Krizi' simülasyonundaki karar izlerini (telemetry) analiz ederek:
1. Veli için: Sınav notu içermeyen, çocuğun nasıl düşündüğünü anlatan sıcak bir özet (parent_summary) ve akşam yemeğinde çocuğa sorulabilecek açık uçlu 1 sohbet sorusu (dinner_table_question) üret.
2. Öğretmen için: Sistem düşüncesi, kanıt kullanımı, ödünleşme (trade-off) ve revizyon davranışını özetleyen pedagojik değerlendirme (teacher_summary) ve sınıf içi tartışma önerisi (classroom_discussion_prompt) üret.
KESİN KURAL: Çocuğa puan verme, eksik/başarısız diye etiketleme; süreç odaklı ve yapıcı bir dil kullan.`;

  const picked1 = (plan?.solutionIds ?? []).map((id) => SOLUTION_NAMES[id] || id).join(", ");
  const picked2 = (altPlan?.solutionIds ?? []).map((id) => SOLUTION_NAMES[id] || id).join(", ");

  const input = `Öğrenci Oturum Özeti:
- Kasaba Parametreleri: Rezerv %${facts.reservoirPct ?? 40}, Kaçak %${facts.leakPct ?? 25} (${facts.leakL ?? 45} L/dk).
- Toplanan Kanıt / Bulgu Sayısı: ${notebook.length}
- Kadim Uyum Haritası: ${kadim ? `Çözüldü (${kadim.placeTries} yerleştirme denemesi, ${kadim.hints} ipucu, kuraklık önceliği tahmini: ${kadim.prediction}, öz-güven: ${kadim.confidence}/5)` : "Henüz tamamlanmadı"}
- 1. Plan Seçimleri: ${picked1 || "Yok"} (Maliyet: ${plan?.totalCost ?? 0} TL)
- Öğrencinin 1. Plan Gerekçesi: "${plan?.rationale ?? ""}"
- LLM Gerekçe Analizi Özeti: ${rationaleAnalysis ? JSON.stringify(rationaleAnalysis) : "Yok"}
- Alternatif Plan (Revizyon): ${picked2 ? `${picked2} (Gerekçe: "${altPlan?.rationale ?? ""}")` : "Denenmedi"}
- Kapanış Cümlesi: "${session?.finalStatement ?? ""}"`;

  const llmResult = await callGeminiInteraction({
    systemInstruction,
    input,
    schema: REPORT_SCHEMA,
    maxOutputTokens: 800,
  });

  return llmResult ?? fallbackGenerateReport(body);
}

// ---------------------------------------------------------------------------
// 3. Dynamic Simulation RAG Guide (/ai/guide-chat)
// ---------------------------------------------------------------------------

const GUIDE_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    socratic_question: { type: "string" },
    suggested_district: { type: "string" },
  },
  required: ["reply", "socratic_question", "suggested_district"],
};

function fallbackGuideChat(body) {
  const q = String(body?.question ?? "").toLowerCase();
  const f = body?.facts ?? {};
  const quest = String(body?.quest ?? "investigate");
  const outflowL = f.outflowL ?? 180;
  const leakL = f.leakL ?? 45;
  const leakPct = f.leakPct ?? 25;
  const reservoirPct = f.reservoirPct ?? 40;
  const farmL = f.farmL ?? 110;
  const parkL = f.parkL ?? 25;

  if (/baraj|rezerv|aylin|su ne kadar|seviye/.test(q)) {
    return {
      reply: `Şu an kasabamızın baraj doluluk oranı %${reservoirPct} seviyesinde ve barajdan dakikada ${outflowL} litre su çıkıyor. Mühendis Aylin kritik eşiğin %${f.criticalPct ?? 28} olduğunu söylüyor.`,
      socratic_question: `Barajdan çıkan ${outflowL} L/dk suyun tamamı evlere ulaşıyor mu, yoksa yolda kaybolan bir kısım var mı dersin?`,
      suggested_district: "Kuzey · Baraj ve Rezervuar (Mühendis Aylin)",
    };
  }

  if (/kaçak|boru|nuri|mahalle|ev|sızıntı/.test(q)) {
    return {
      reply: `Çınar Caddesi'nde Nuri Amca'nın bahsettiği eski borulardan dakikada tam ${leakL} litre (yani şebeke suyunun %${leakPct}'i) toprağa karışıp kayboluyor!`,
      socratic_question: `Eğer bu boru kaçağını onarırsak yüksek bir bütçe harcayacağız ama her dakika ${leakL} litre temiz suyu kurtaracağız. Sence buna değer mi?`,
      suggested_district: "Doğu · Konut Bölgesi (Nuri Amca)",
    };
  }

  if (/tarla|çiftçi|rıza|tarım|damla|ekin|sebze/.test(q)) {
    return {
      reply: `Çiftçi Rıza'nın tarlaları kendi kanalından dakikada ${farmL} litre su çekiyor. Açık kanaldan salma sulama yapıldığında suyun önemli bir kısmı buharlaşıyor.`,
      socratic_question: `Tarlaların suyunu tamamen kesmek yerine damla sulamaya geçersek hem ürünleri koruyup hem suyu azaltabilir miyiz?`,
      suggested_district: "Batı · Tarım Vadisi (Çiftçi Rıza)",
    };
  }

  if (/park|kemal|fıskiye|yeşil/.test(q)) {
    return {
      reply: `Merkez Park dakikada ${parkL} litre su kullanıyor ve bunun bir kısmı öğle sıcağında çalışan süs fıskiyelerine gidiyor.`,
      socratic_question: `Kuraklık sırasında süs fıskiyelerini kapatmak bütçeden hiç para harcamadan su kazandırır; peki park sakinleri buna nasıl tepki verir?`,
      suggested_district: "Merkez · Kasaba Parkı (İşçi Kemal)",
    };
  }

  if (/bütçe|para|toplantı|başkan|ne seç|hangisi/.test(q)) {
    return {
      reply: `Belediye Başkanımız toplam 1.000.000 ₺ bütçe ayırdı. Tüm çözümleri aynı anda alacak paramız yok, bu yüzden en etkili kombinasyonu kurmalıyız.`,
      socratic_question: `Defterindeki kanıtlara baktığında kasabada en büyük su kaybı nerede yaşanıyor ve hangi iki-üç çözüm birbirini tamamlar?`,
      suggested_district: "Güney · Belediye Binası (Başkan Adil)",
    };
  }

  return {
    reply: `Kasabamızda şu an rezervuar %${reservoirPct} dolulukta ve dakikada ${leakL} litre su eski borulardan sızıyor. Şu an '${quest}' aşamasındayız.`,
    socratic_question: `Baraj, Tarım, Konut ve Park bölgelerinden hangisinin verisi seni daha çok düşündürdü?`,
    suggested_district: "Merkez Park veya henüz gezmediğin bir bölge",
  };
}

async function handleGuideChat(body) {
  const question = String(body?.question ?? "").trim();
  const f = body?.facts ?? {};
  const quest = String(body?.quest ?? "investigate");
  const completedCards = Array.isArray(body?.completedCards) ? body.completedCards : [];
  const plan = body?.plan ?? null;
  const history = Array.isArray(body?.history) ? body.history.slice(-4) : [];

  if (!question) {
    return fallbackGuideChat(body);
  }

  const systemInstruction = `Sen 'Denge Kasabası' eğitimsel oyununun rehber karakteri Lina'sın. Karşında 10-12 yaşında bir öğrenci var.
GÖREVİN (DİNAMİK DURUM RAG REHBERİ):
1. Sana verilen 'Öğrencinin Kasaba Simülasyon Verileri'ni (baraj yüzdesi, L/dk akışlar, kaçak oranı, gezilen bölgeler) gerçek dünya bilgisi olarak kullan. Asla bu sayıların dışında sayı uydurma (halüsinasyon görme).
2. SOKRATESÇİ YÖNTEM: Öğrenciye 'Şu paketi seç' diye hazır cevap VERME. Onun yerine kasabadaki veriyi hatırlatıp düşündürücü bir soru (socratic_question) ile kendi kararını bulmasını sağla.
3. ÇOCUK GÜVENLİĞİ: Konu oyun veya su/çevre/sistem düşüncesi dışına çıkarsa nazikçe kasabadaki görevimize geri davet et. Kısa, sıcak ve anlaşılır Türkçe kullan.`;

  const historyText = history
    .map((h) => `Öğrenci: ${h.q}\nLina: ${h.a}`)
    .join("\n");

  const input = `Öğrencinin Kasaba Simülasyon Verileri (Deterministik RAG Bağlamı):
- Mevcut Aşama: ${quest}
- Baraj Doluluk Oranı: %${f.reservoirPct ?? 40} (Kritik eşik: %${f.criticalPct ?? 28})
- Barajdan Kasabaya Çıkış: ${f.outflowL ?? 180} L/dk
- Şebeke Boru Kaçağı (Nuri Amca / Konut): ${f.leakL ?? 45} L/dk (%${f.leakPct ?? 25} kayıp)
- Evlere Ulaşan Su: ${f.homesL ?? 110} L/dk
- Merkez Park Tüketimi (İşçi Kemal): ${f.parkL ?? 25} L/dk
- Tarım Kanalı Çekimi (Çiftçi Rıza): ${f.farmL ?? 110} L/dk
- Yağış Açığı: %${f.rainDeficitPct ?? 30}
- İncelenen Bölgeler: ${completedCards.join(", ") || "Henüz yok"}
- Seçilen Plan: ${plan ? plan.solutionIds?.join(", ") : "Henüz seçilmedi"}
${historyText ? `\nÖnceki Sohbet:\n${historyText}\n` : ""}
Öğrencinin Yeni Sorusu: "${question}"`;

  const llmResult = await callGeminiInteraction({
    systemInstruction,
    input,
    schema: GUIDE_SCHEMA,
    maxOutputTokens: 450,
  });

  return llmResult ?? fallbackGuideChat(body);
}

// ---------------------------------------------------------------------------
// Main Router for /ai/*
// ---------------------------------------------------------------------------

export async function handleAiRequest(req, res, path) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    return res.end();
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method Not Allowed. Use POST." });
  }

  try {
    const body = await readJsonBody(req);
    const cleanPath = path.split("?")[0].replace(/\/+$/, "");

    if (cleanPath === "/ai/analyze-rationale") {
      const result = await handleAnalyzeRationale(body);
      return sendJson(res, 200, result);
    }

    if (cleanPath === "/ai/generate-report") {
      const result = await handleGenerateReport(body);
      return sendJson(res, 200, result);
    }

    if (cleanPath === "/ai/guide-chat") {
      const result = await handleGuideChat(body);
      return sendJson(res, 200, result);
    }

    return sendJson(res, 404, { error: `Unknown AI endpoint: ${cleanPath}` });
  } catch (err) {
    return sendJson(res, 500, {
      error: "AI request processing error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
