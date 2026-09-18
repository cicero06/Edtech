import type { AreaDefinition } from '../types/area.ts'
import type { LocationId } from '../types/scenario.ts'

export const areas: Record<LocationId, AreaDefinition> = {
  dam: {
    title: 'Baraj', subtitle: 'Kasabanın Su Rezervi', icon: '💧',
    character: { id: 'murat', name: 'Murat', role: 'Su Mühendisi', fallback: '👨‍🔧', portraitAlt: 'Murat için geçici karakter görseli' },
    opening: 'Merhaba! Ben Murat. Kasabanın su sistemini takip ediyorum.',
    content: [
      { type: 'speech', text: 'Şu gördüğün baraj, Denge Kasabası’nın en önemli su kaynaklarından biri.' },
      { type: 'speech', text: 'Yağmur ve kar suları barajda birikir. Daha sonra bu su evlerin, tarlaların ve kasabanın diğer ihtiyaçlarının karşılanması için kullanılabilir.' },
      { type: 'speech', text: 'Ancak barajdaki su miktarı her zaman aynı kalmaz. Şunlar barajdaki suyun azalmasına neden olabilir:' },
      { type: 'list', items: ['☀️ Yağışların azalması', '💧 Suyun fazla kullanılması', '🌡️ Sıcak havalarda buharlaşmanın artması'] },
    ],
    fact: { title: 'Biliyor muydun?', text: 'Barajdaki su sadece bugün için değil, gelecekteki ihtiyaçlar için de önemlidir. Bu yüzden yalnızca “Şu anda ne kadar suyumuz var?” değil, “Daha sonra ne kadar suya ihtiyacımız olacak?” sorusunu da düşünmeliyiz.' },
    clue: '💧 Su sınırlı bir kaynaktır.',
  },
  homes: {
    title: 'Evler', subtitle: 'Kasabada Günlük Yaşam', icon: '🏠',
    character: { id: 'elif', name: 'Elif', role: 'Kasaba Sakini', fallback: '👩', portraitAlt: 'Elif için geçici karakter görseli' },
    opening: 'Merhaba! Ben Elif. Denge Kasabası’nda ailemle birlikte yaşıyorum.',
    content: [
      { type: 'speech', text: 'Günlük hayatımızda düşündüğümüzden daha fazla yerde su kullanıyoruz.' },
      { type: 'list', items: ['🚿 Duş almak', '🚽 Tuvaleti kullanmak', '🍳 Yemek hazırlamak', '🧺 Çamaşır yıkamak', '🌱 Bahçeyi sulamak'] },
      { type: 'speech', text: 'Bir kişinin kullandığı su küçük görünebilir. Ama kasabada binlerce kişi yaşadığında bu kullanımlar bir araya gelerek çok büyük miktarlara ulaşabilir.' },
    ],
    clue: '🏠 Küçük kullanımlar birleştiğinde büyük etki oluşturabilir.',
  },
  agriculture: {
    title: 'Tarım', subtitle: 'Tarlalar ve Sulama', icon: '🌾',
    character: { id: 'hasan', name: 'Hasan', role: 'Çiftçi', fallback: '👨‍🌾', portraitAlt: 'Hasan için geçici karakter görseli' },
    opening: 'Hoş geldin! Ben Hasan. Bu tarlalarda ürün yetiştiriyorum.',
    content: [
      { type: 'speech', text: 'Bitkilerin büyüyebilmesi için suya ihtiyacımız var. Özellikle yağışların az olduğu zamanlarda tarlaları sulamamız gerekiyor.' },
      { type: 'speech', text: 'Ancak kullandığımız su miktarı şunlara göre değişebilir:' },
      { type: 'list', items: ['🌱 Yetiştirilen ürün', '☀️ Hava koşulları', '💧 Sulama yöntemi'] },
    ],
    fact: { title: 'İlginç bilgi', text: 'Aynı miktarda su kullanan iki sulama yöntemi aynı sonucu vermeyebilir. Bazı yöntemlerde suyun bir kısmı bitkilere ulaşmadan kaybolabilir.' },
    clue: '🌾 Suyu azaltmak kadar, suyu nasıl kullandığımız da önemlidir.',
  },
  park: {
    title: 'Park', subtitle: 'Kasabanın Yeşil Alanları', icon: '🌳',
    character: { id: 'zeynep', name: 'Zeynep', role: 'Peyzaj / Yeşil Alan Uzmanı', fallback: '👩‍🌾', portraitAlt: 'Zeynep için geçici karakter görseli' },
    opening: 'Merhaba! Ben Zeynep. Kasabanın parkları ve yeşil alanlarıyla ilgileniyorum.',
    content: [
      { type: 'speech', text: 'Parklar yalnızca kasabanın güzel görünmesini sağlamaz. Ağaçlar ve yeşil alanlar:' },
      { type: 'list', items: ['🌳 Gölge sağlayabilir', '🐦 Canlılara yaşam alanı oluşturabilir', '🌿 Şehir yaşamını daha yaşanabilir hale getirebilir'] },
      { type: 'speech', text: 'Ancak sıcak ve kurak dönemlerde onların da suya ihtiyacı vardır.' },
    ],
    clue: '🌳 Bir kararın çevresel sonuçlarını da düşünmeliyiz.',
  },
  municipality: {
    title: 'Belediye', subtitle: 'İhtiyaçlar ve Ortak Kararlar', icon: '🏛️',
    character: { id: 'derya', name: 'Derya', role: 'Belediye Mühendisi / Şehir Plancısı', fallback: '👩‍💼', portraitAlt: 'Derya için geçici karakter görseli' },
    opening: 'Kasabayı gezdiğini duydum. Gördüğün gibi su sorunu yalnızca tek bir bölgeyi ilgilendirmiyor.',
    content: [
      { type: 'speech', text: 'Belediye olarak aynı anda tüm bu alanları düşünmek zorundayız:' },
      { type: 'list', items: ['🏠 Evleri', '🌾 Tarımı', '🌳 Parkları', '💧 Su rezervini'] },
      { type: 'speech', text: 'Ancak başka bir sınırımız daha var: 💰 Bütçe.' },
      { type: 'speech', text: 'Her çözümü aynı anda uygulayamayız. Bu nedenle hangi çözümlerin daha önemli olduğuna karar vermemiz gerekiyor.' },
    ],
    clue: '🏛️ Karar verirken ihtiyaçları, sonuçları ve maliyeti birlikte düşünmeliyiz.',
  },
}
