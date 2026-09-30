/**
 * Karakter sesleri - gerçek mırıltı dosyaları (Banjo-Kazooie usulü).
 *
 * `public/assets/audio/voices/<npcId>.mp3` — her karakter için kısa bir
 * "mırıltı" döngüsü (ElevenLabs, TTSMaker vb. bir tool'dan üretilir).
 * Typewriter yazarken dosya loop'ta çalar; satır bitince ya da kart
 * kapanınca durur. Dosya henüz yoksa sessizce geçilir - hiçbir şey kırılmaz.
 *
 * VOICE_TUNE ile aynı kayıttan bile farklı ses çıkar: playbackRate hem hızı
 * hem perdeyi değiştirir (0.8 = kalın+yavaş, 1.25 = ince+çevik).
 */

import { isMuted } from './audio';

/** Karakter başına hız/perde ve ses düzeyi ayarı. */
const VOICE_TUNE: Record<string, { rate: number; volume: number }> = {
  lina: { rate: 1.25, volume: 0.8 },
  'elif-teyze': { rate: 0.95, volume: 0.7 },
  mayor: { rate: 0.8, volume: 0.85 },
  'muhendis-aylin': { rate: 1.1, volume: 0.75 },
  'ciftci-riza': { rate: 0.9, volume: 0.8 },
  'nuri-amca': { rate: 0.78, volume: 0.85 },
  'isci-kemal': { rate: 1.0, volume: 0.75 },
};

const voiceUrl = (npcId: string): string =>
  `${import.meta.env.BASE_URL}assets/audio/voices/${npcId}.mp3`;

let current: HTMLAudioElement | null = null;

export function playRecordedVoice(file?: string | null): void {
  stopVoice();
  if (!file || typeof window === 'undefined') return;
  const audio = new Audio(`${import.meta.env.BASE_URL}assets/audio/voices/${file}`);
  audio.loop = false;
  audio.playbackRate = 1;
  audio.volume = 0.85;
  audio.muted = isMuted();
  current = audio;
  const release = () => {
    if (current === audio) stopVoice();
  };
  audio.onended = release;
  audio.onerror = release;
  void audio.play().catch(release);
}

export function setVoiceMuted(muted: boolean): void {
  if (current) current.muted = muted;
}

/** Typewriter başlarken karakterin mırıltısını loop'a al. */
export function startVoice(npcId?: string): void {
  stopVoice();
  if (isMuted() || !npcId || typeof window === 'undefined') return;
  const audio = new Audio(voiceUrl(npcId));
  const tune = VOICE_TUNE[npcId] ?? { rate: 1, volume: 0.75 };
  audio.loop = true;
  audio.playbackRate = tune.rate;
  audio.volume = tune.volume;
  // Dosya yoksa play() reddeder - sessizce geçeriz.
  void audio.play().catch(() => {});
  current = audio;
}

/** Satır bitti / kart kapandı / skip basıldı - mırıltıyı kes. */
export function stopVoice(): void {
  current?.pause();
  current = null;
}
