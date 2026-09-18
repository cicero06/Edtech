import type { CharacterDefinition, DialogueDefinition } from '../types/dialogue.ts'

export const lina: CharacterDefinition = {
  id: 'lina',
  name: 'Lina',
  portrait: 'denge-kasabasi/characters/lina.svg',
  portraitAlt: 'Lina, kasabayı keşfederken sana eşlik eden arkadaşın',
  fallback: '👧',
}

export const linaIntro: DialogueDefinition = {
  id: 'lina-intro',
  character: lina,
  nextLabel: 'Devam',
  completeLabel: 'Haydi keşfedelim!',
  steps: [
    "Merhaba! Ben Lina. Denge Kasabası’nda yaşıyorum.",
    'Son birkaç haftadır kasabamızda bir şeyler değişmeye başladı. Barajdaki su seviyesi düşüyor.',
    'Bazı tarlalar yeterince sulanamıyor. Belediye, suyu nasıl kullanacağımız konusunda yeni bir plan hazırlamaya çalışıyor.',
    'Ama bu sadece suyla ilgili bir sorun değil.',
    'Kasabamızda evler, tarlalar, parklar ve belediye birbirine bağlı.',
    'Bir yerde aldığımız karar başka bir yerde farklı bir sonuç oluşturabilir.',
    'Belediye başkanı senden yardım istiyor.',
    'Kasabanın farklı bölgelerini inceleyip su sorununun nedenlerini keşfetmeye ve bir çözüm planı hazırlamaya ne dersin?',
    'Haydi, önce kasabayı birlikte keşfedelim!',
  ],
}

export const linaFirstTask: DialogueDefinition = {
  id: 'lina-first-task',
  character: lina,
  nextLabel: 'Devam',
  completeLabel: 'Bölgeleri incele',
  steps: ['Kasabamızın suya nerelerde ihtiyaç duyduğunu bul.'],
}

export const firstTask = {
  title: 'İlk Görevin',
  instruction: 'Haritadaki 5 bölgeyi incele.',
  hint: 'Her bölge sana kasabanın su kullanımı hakkında farklı bir ipucu verecek.',
  progressLabel: 'Kasabayı Keşfet',
  continueLabel: 'ÇÖZÜMLERİ İNCELE',
  lockedMessage: 'Önce tüm bölgeleri incele',
}

export const linaExplorationComplete: DialogueDefinition = {
  id: 'lina-exploration-complete',
  character: lina,
  nextLabel: 'Devam',
  completeLabel: 'Çözümleri incele',
  steps: ['Harika! Kasabanın tüm bölgelerini inceledin. Artık su sorununu çözmek için elimizde yeterince bilgi var.'],
}
