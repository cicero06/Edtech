import type { EvidenceDetail } from '../types/evidence.ts'
import type { SourceId } from '../types/scenario.ts'

export const evidenceSources: Record<SourceId, EvidenceDetail> = {
  municipality_engineer: {
    kind: 'character',
    character: { id: 'derya', name: 'Derya', role: 'Belediye Mühendisi', portrait: 'denge-kasabasi/characters/derya/portrait.svg', portraitAlt: 'Derya için geçici portre', fallback: '👩‍💼' },
    speech: [
      'Merhaba, ben Derya. Belediyede kasabanın su kullanımı ve altyapı planlamasıyla ilgileniyorum.',
      'Son haftalarda barajdaki su seviyesinin düştüğünü görüyoruz. Ancak çözüm üretirken sadece bugünkü su miktarını değil, gelecekteki ihtiyacı da düşünmemiz gerekiyor.',
      'Evler, tarım alanları ve parklar aynı su kaynağını kullanıyor. Bir bölge için aldığımız karar diğer bölgeleri de etkileyebilir.',
    ],
    takeaway: 'Kasabanın su sistemi birbirine bağlıdır ve planlama yapılırken gelecekteki ihtiyaçlar da hesaba katılmalıdır.',
  },
  farmer: {
    kind: 'character',
    character: { id: 'hasan', name: 'Hasan', role: 'Çiftçi', portrait: 'denge-kasabasi/characters/hasan/portrait.svg', portraitAlt: 'Hasan için geçici portre', fallback: '👨‍🌾' },
    speech: [
      'Ben Hasan. Kasabanın çevresindeki tarlalarda ürün yetiştiriyorum.',
      'Yağışların az olduğu dönemlerde tarlaları sulamamız gerekiyor. Eğer yeterli su olmazsa bazı ürünlerin verimi düşebilir.',
      'Ama kullandığımız sulama yöntemi de önemli. Bazı yöntemlerde suyun bir kısmı bitkilere ulaşmadan kaybolabiliyor.',
    ],
    takeaway: 'Tarımın su ihtiyacı vardır ancak kullanılan sulama yöntemi toplam su tüketimini değiştirebilir.',
  },
  environmental_expert: {
    kind: 'character',
    character: { id: 'zeynep', name: 'Zeynep', role: 'Çevre Uzmanı', portrait: 'denge-kasabasi/characters/zeynep/portrait.svg', portraitAlt: 'Zeynep için geçici portre', fallback: '👩‍🌾' },
    speech: [
      'Merhaba, ben Zeynep. Kasabanın yeşil alanları ve çevresel etkileriyle ilgileniyorum.',
      'Parklar sadece güzel görünmek için değildir. Ağaçlar gölge sağlar, canlılara yaşam alanı oluşturur ve sıcak havalarda çevrenin daha yaşanabilir olmasına yardımcı olur.',
      'Su sıkıntısı olduğunda parkların sulaması yeniden planlanabilir. Ancak yeşil alanları tamamen gözden çıkarmak başka sorunlara yol açabilir.',
    ],
    takeaway: 'Su tasarrufu yapılırken kararların çevresel sonuçları da düşünülmelidir.',
  },
  water_usage: {
    kind: 'distribution',
    description: 'Veriler bize kasabadaki suyun hangi alanlarda daha yoğun kullanıldığını gösterir.',
    takeaway: 'Karar verirken yalnızca görüşlere değil, kullanım verilerine de bakmak gerekir.',
  },
  social_media: {
    kind: 'claim',
    quote: 'Barajdaki su çok hızlı azalıyor. Böyle giderse birkaç gün içinde tamamen kuruyacak!',
    verification: { title: 'Bu bilgi doğrulanmış mı?', text: 'Hayır. Paylaşımda kaynak veya resmî veri belirtilmemiş.' },
    guidance: 'Bir iddia önemli olabilir. Ama karar vermeden önce başka kaynaklarla karşılaştırmak iyi bir fikir olabilir.',
    takeaway: 'Kaynağı belirtilmeyen bir iddia karar vermek için tek başına yeterli değildir.',
  },
  municipality_budget: {
    kind: 'budget', title: 'Belediye bütçe kaydı',
    description: 'Belediyenin kaynakları sınırlıdır. Bu nedenle bütün çözümleri aynı anda uygulamak mümkün olmayabilir.',
    explanation: { title: 'Bu ne anlama geliyor?', text: 'Bir çözüm seçerken yalnızca faydasını değil, maliyetini de düşünmemiz gerekiyor.' },
    takeaway: 'Kaynaklar sınırlı olduğu için çözüm seçimlerinde öncelik belirlemek gerekir.',
  },
}

export const researchGuide = {
  introduction: 'Bir plan hazırlamadan önce farklı kişileri dinleyelim ve verileri inceleyelim. Unutma: Her kaynak bize aynı türde bilgi vermeyebilir.',
  complete: 'Harika! Artık farklı görüşleri, verileri ve bütçe bilgisini inceledin. Şimdi bu bilgileri birlikte değerlendirerek kasaba için bir plan hazırlayabiliriz.',
  hint: 'Farklı kaynak türlerini karşılaştır. Bir kişinin görüşü ile resmî veri aynı türde bilgi değildir.',
  requirement: 'Önce 6 kaynağın tamamını incele.',
}
