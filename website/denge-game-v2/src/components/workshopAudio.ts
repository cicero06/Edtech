/** Tiny synth blips shared by the district workshops — no audio assets needed. */
export function playTone(kind: 'tap' | 'win' | 'alert' = 'tap', enabled = true): void {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;
    if (kind === 'win') {
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(780, t + 0.2);
      gain.gain.value = 0.04;
      osc.stop(t + 0.35);
    } else if (kind === 'alert') {
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.setValueAtTime(220, t + 0.1);
      gain.gain.value = 0.05;
      osc.stop(t + 0.25);
    } else {
      osc.frequency.value = 260;
      gain.gain.value = 0.02;
      osc.stop(t + 0.06);
    }
    osc.start(t);
    osc.onended = () => void ctx.close();
  } catch {
    /* autoplay restrictions — silence is fine */
  }
}
