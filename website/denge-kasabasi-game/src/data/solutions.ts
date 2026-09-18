import type { InterventionId } from '../types/scenario.ts'
import type { SolutionDetailData } from '../types/solution.ts'

// Costs and numeric water effects remain in waterCrisisScenario.
export const solutions: Record<InterventionId, SolutionDetailData> = {
  'network-leak-repair': {
    description: 'Su şebekesindeki kaçakları bularak onarmayı ve dağıtım sırasında kaybolan suyu azaltmayı hedefler.',
    benefits: ['Suyun daha verimli dağıtılmasını destekleyebilir.', 'Evlerin ve tarlaların kullandığı ortak altyapıyı iyileştirebilir.'],
    risks: ['Onarım bütçe ve zaman gerektirir.', 'Çalışmalar sırasında bazı bölgelerde geçici kesintiler olabilir.'],
    labels: ['💧 Su etkisi: Yüksek', '🌳 Çevresel risk: Düşük', '⏱️ Etki süresi: Orta vadeli'],
    characterSource: 'municipality_engineer',
    comment: 'Şebekedeki kayıpları azaltmak kullanılan suyun daha verimli dağıtılmasına yardımcı olabilir.',
    evidenceLinks: ['municipality_engineer', 'water_usage'], environmentRisk: 'low', longTermBenefit: false,
  },
  'reduce-agricultural-irrigation': {
    description: 'Tarlaların sulanmasında kullanılan su miktarını azaltır. Ürünlerin ihtiyacı ve sulama yöntemi birlikte düşünülmelidir.',
    benefits: ['Kısa sürede su kullanımını azaltabilir.', 'Başlangıç maliyeti düşüktür.'],
    risks: ['Sulamanın fazla azaltılması ürünlerin verimini düşürebilir.', 'Su tasarrufunun tarımsal üretime etkisi izlenmelidir.'],
    labels: ['💧 Su etkisi: Yüksek', '🌾 Tarım etkisi: Olumsuz olabilir', '⏱️ Etki süresi: Hızlı'],
    characterSource: 'farmer',
    comment: 'Su tasarrufu önemli ama sulama çok fazla azaltılırsa bazı ürünler zarar görebilir.',
    evidenceLinks: ['farmer', 'water_usage'], environmentRisk: 'unspecified', longTermBenefit: false,
  },
  'reduce-park-irrigation': {
    description: 'Parkların sulama miktarını yeniden düzenleyerek su tasarrufu sağlamayı hedefler.',
    benefits: ['Hızlı uygulanabilir.', 'Düşük maliyetle bir miktar su tasarrufu sağlayabilir.'],
    risks: ['Uzun süreli ve aşırı azaltma yeşil alanları etkileyebilir.', 'Gölge ve canlıların yaşam alanları üzerindeki sonuçlar düşünülmelidir.'],
    labels: ['💧 Su etkisi: Düşük', '🌳 Çevresel etki: Orta risk', '⏱️ Etki süresi: Hızlı'],
    characterSource: 'environmental_expert',
    comment: 'Bir miktar azaltma mümkün olabilir. Ama uzun süreli ve aşırı azaltma yeşil alanlarını etkileyebilir.',
    evidenceLinks: ['environmental_expert'], environmentRisk: 'medium', longTermBenefit: false,
  },
  'rainwater-harvesting': {
    description: 'Yağmur suyunu toplayıp uygun ihtiyaçlarda kullanmak için bir sistem kurar.',
    benefits: ['Uzun vadede kasabanın su kaynaklarını destekleyebilir.', 'Mevcut su kaynağına olan talebin bir kısmını azaltabilir.'],
    risks: ['Başlangıç maliyeti yüksektir.', 'Toplanabilecek su yağışlara bağlıdır; kısa vadeli katkı değişebilir.'],
    labels: ['💧 Su etkisi: Orta', '🌳 Çevresel risk: Düşük', '🔮 Uzun vadeli fayda: Yüksek'],
    characterSource: 'municipality_engineer',
    comment: 'Başlangıç maliyeti yüksek olabilir ama uzun vadede kasabanın su kaynaklarını destekleyebilir.',
    evidenceLinks: ['municipality_engineer', 'municipality_budget'], environmentRisk: 'low', longTermBenefit: true,
  },
  'new-well': {
    description: 'Kasabanın su ihtiyacını desteklemek için yeni bir kuyu açılmasını önerir.',
    benefits: ['Kısa vadede ek su sağlayabilir.', 'Mevcut kaynak üzerindeki baskıyı hafifletebilir.'],
    risks: ['Uzun vadeli çevresel sonuçları belirsizdir.', 'Yeraltı suyunun gelecekteki durumu da değerlendirilmelidir.'],
    labels: ['💧 Kısa vadeli su etkisi: Yüksek', '🔮 Uzun vadeli çevresel sonuç: Belirsiz'],
    characterSource: 'environmental_expert',
    comment: 'Yeni bir su kaynağı kısa vadede rahatlama sağlayabilir. Ancak uzun vadeli çevresel etkisini de düşünmek gerekir.',
    evidenceLinks: ['municipality_engineer', 'environmental_expert'], environmentRisk: 'uncertain', longTermBenefit: false,
  },
}

export const planningCopy = {
  guidance: 'En yüksek su tasarrufu sağlayan seçenek her zaman en dengeli çözüm olmayabilir.',
  budgetFreedom: '1, 2 veya 3 çözümle devam edebilirsin. Bütçenin tamamını harcamak zorunda değilsin.',
  estimateNote: 'Su etkisi oyunun tahminidir. Nitel etkiler seçilen çözümlerdeki riskleri birlikte gösterir; bir fayda diğer riskleri ortadan kaldırmaz.',
  confirmation: 'Bu planın farklı alanlarda farklı sonuçları olabilir.',
}
