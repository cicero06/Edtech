/**
 * Karakter sesleri — Dinamik Senaryo Seslendirme + Karakter Mırıltı Sistemi.
 *
 * Her öğrencinin kasaba senaryosu farklı sayılar ve cümleler ürettiği için:
 * 1. Sabit (sayı içermeyen) genel repliklerde varsa MP3 kaydı çalar.
 * 2. Senaryoya özel dinamik repliklerde (`voiceFiles[i] === null`), ekrandaki
 *    cümleyle çelişen eski sabit MP3'ü çalmak yerine tarayıcının Türkçe TTS
 *    motoruyla (`speechSynthesis`) karaktere özel ses tonu/hızında okur ve
 *    yazı akarken karakterin ses dokusunu (`VOICE_TUNE`) eşlikçi olarak kullanır.
 */

import { isMuted } from './audio';

/** Karakter başına hız/perde ve ses düzeyi ayarı. */
const VOICE_TUNE: Record<string, { rate: number; pitch: number; volume: number }> = {
  lina: { rate: 1.08, pitch: 1.18, volume: 0.78 },
  'elif-teyze': { rate: 0.94, pitch: 1.12, volume: 0.7 },
  mayor: { rate: 0.95, pitch: 0.82, volume: 0.85 },
  'muhendis-aylin': { rate: 1.04, pitch: 1.08, volume: 0.75 },
  'ciftci-riza': { rate: 0.94, pitch: 0.86, volume: 0.8 },
  'nuri-amca': { rate: 0.88, pitch: 0.76, volume: 0.85 },
  'isci-kemal': { rate: 1.0, pitch: 0.95, volume: 0.75 },
};

const voiceUrl = (npcId: string): string =>
  `${import.meta.env.BASE_URL}assets/audio/voices/${npcId}.mp3`;

let current: HTMLAudioElement | null = null;

function stopSpeechSynthesis(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export function playRecordedVoice(
  file?: string | null,
  npcId?: string,
  dynamicText?: string,
): void {
  stopVoice();
  if (typeof window === 'undefined' || isMuted()) return;

  // If this line has a valid static recording (non-numeric generic line), play it:
  if (file) {
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
    return;
  }

  // Otherwise, the line is dynamically generated for this student's scenario!
  // Speak the exact scenario text using Turkish speechSynthesis with character tuning:
  if (dynamicText && 'speechSynthesis' in window) {
    try {
      const cleanText = dynamicText.replace(/💧|🌾|🏠|🌳|🏛️|🎉|📊|🔎|⏳/gu, '').trim();
      const utter = new SpeechSynthesisUtterance(cleanText);
      utter.lang = 'tr-TR';
      const tune = (npcId && VOICE_TUNE[npcId]) || { rate: 1.0, pitch: 1.0, volume: 0.8 };
      utter.rate = tune.rate;
      utter.pitch = tune.pitch;
      utter.volume = tune.volume;

      const voices = window.speechSynthesis.getVoices();
      const trVoice = voices.find((v) => v.lang.toLowerCase().startsWith('tr'));
      if (trVoice) {
        utter.voice = trVoice;
      }
      window.speechSynthesis.speak(utter);
      return;
    } catch {
      // Fall through to character murmur loop if speechSynthesis is blocked
    }
  }

  if (npcId) {
    startVoice(npcId);
  }
}

export function setVoiceMuted(muted: boolean): void {
  if (current) current.muted = muted;
  if (muted) stopSpeechSynthesis();
}

/** Typewriter başlarken karakterin mırıltısını loop'a al. */
export function startVoice(npcId?: string): void {
  stopVoice();
  if (isMuted() || !npcId || typeof window === 'undefined') return;
  const audio = new Audio(voiceUrl(npcId));
  const tune = VOICE_TUNE[npcId] ?? { rate: 1, pitch: 1, volume: 0.75 };
  audio.loop = true;
  audio.playbackRate = tune.rate;
  audio.volume = tune.volume * 0.45;
  void audio.play().catch(() => {});
  current = audio;
}

/** Satır bitti / kart kapandı / skip basıldı - mırıltıyı ve TTS'i kes. */
export function stopVoice(): void {
  current?.pause();
  current = null;
  stopSpeechSynthesis();
}
