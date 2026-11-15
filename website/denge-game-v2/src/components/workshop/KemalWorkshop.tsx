/**
 * İşçi Kemal's smart-park workshop — web port of the Unity mini-game
 * (GameHUD.Kemal.cs). Replaces the plain Park investigation card.
 *
 *   1. briefing — Kemal explains the 25 L park reading and the wet paths,
 *                 then sends the student into the park
 *   2. (in town) — three real sprinklers spray onto paths; the student walks
 *                 up and turns each one onto grass (GameScene, fieldTasks.ts)
 *   3. hour     — back with Kemal: predict the watering time with the least
 *                 evaporation
 *   4. done     — "Yeşil Vaha Koruyucusu" badge, +10 L saved
 *
 * Metrics include the in-town turns, so the teacher sees how the student
 * got there, not only that they finished.
 */
import { useState } from 'react';
import type { MinigameResult } from '../../Game/data/minigames';
import type { FieldResult } from '../../Game/data/fieldTasks';
import { TextureKeys } from '../../Game/data/assets';
import { playTone } from './audio';
import WorkshopShell from './WorkshopShell';

interface HourOption {
  id: 'noon' | 'morning' | 'night';
  label: string;
  loss: number;
  feedback: string;
}

const HOURS: readonly HourOption[] = [
  {
    id: 'noon',
    label: '☀️ 13:00 — Öğle',
    loss: 28,
    feedback: 'Öğle güneşi suyun %28’ini buharlaştırır — su köklere inmeden havaya karışır.',
  },
  {
    id: 'morning',
    label: '🌅 06:00 — Sabah',
    loss: 4,
    feedback: 'Doğru! Sabah serinliğinde kayıp yalnızca %4. Toprak suyu emer, kökler doyar.',
  },
  {
    id: 'night',
    label: '🌙 21:00 — Gece',
    loss: 7,
    feedback: 'Kayıp az (%7) ama gece biriken nem köklerde çürümeye ve mantara yol açabilir.',
  },
];

const WATER_SAVED_L = 10;

type KemalField = Extract<FieldResult, { task: 'kemal-sprinklers' }>;

interface Props {
  /** Set once the sprinklers in the park are fixed. */
  field?: KemalField;
  onGoToField: () => void;
  onComplete: (result: MinigameResult) => void;
  onClose: () => void;
}

type Step = 'briefing' | 'hour' | 'done';

const STEP_LABEL: Record<Step, string> = {
  briefing: 'ADIM 1 · SAHA GÖZLEMİ',
  hour: 'ADIM 3 · SULAMA SAATİ',
  done: 'GÖREV TAMAMLANDI',
};

export default function KemalWorkshop({ field, onGoToField, onComplete, onClose }: Props) {
  const [step, setStep] = useState<Step>(field ? 'hour' : 'briefing');
  const [sound, setSound] = useState(true);
  const [hour, setHour] = useState<HourOption['id'] | null>(null);
  const [wrongHourPicks, setWrongHourPicks] = useState(0);
  const [firstGuess, setFirstGuess] = useState<HourOption['id'] | null>(null);

  const selectedHour = HOURS.find((h) => h.id === hour) ?? null;
  const aligned = !!field;

  const pickHour = (option: HourOption) => {
    if (hour === 'morning') return;
    setHour(option.id);
    setFirstGuess((g) => g ?? option.id);
    if (option.id === 'morning') {
      playTone('win', sound);
    } else {
      setWrongHourPicks((n) => n + 1);
      playTone('alert', sound);
    }
  };

  const finish = () => {
    const rotations = field?.rotations ?? 0;
    const extraTurns = field?.extraTurns ?? 0;
    const score = Math.max(40, Math.min(100, 100 - wrongHourPicks * 15 - extraTurns * 2));
    onComplete({
      gameId: 'kemal',
      score,
      metrics: {
        waterSaved: WATER_SAVED_L,
        rotations,
        extraTurns,
        wrongHourPicks,
        firstGuessCorrect: firstGuess === 'morning' ? 1 : 0,
      },
    });
  };

  const speech: Record<Step, string> = {
    briefing:
      'Merhaba genç dostum! Parkta ölçtüğümüz 25 litre suyun bir kısmı çimlere hiç ulaşmıyor. Fıskiyeler taş yollara ve asfalta su sıçratıyor. Parka çık, her fıskiyenin yanına git ve suyu yeşil alanlara çevir!',
    hour: selectedHour
      ? selectedHour.feedback
      : 'Aslanım! Fıskiyelerin hepsi artık çimleri suluyor, yollar kuru. Şimdi son soru: sence hangi saatte sularsak suyun en azı buharlaşır?',
    done: `Aslanımsın! Sıfır yol israfı, %4 buharlaşma ve ${WATER_SAVED_L} litre net tasarruf. Park hem yemyeşil hem de kuraklığa hazır!`,
  };

  return (
    <WorkshopShell
      theme="kemal"
      eyebrow="HARMONY TOWN · PARK VE BAHÇELER ŞEFLİĞİ"
      title="İşçi Kemal’in Akıllı Park Atölyesi"
      stepLabel={STEP_LABEL[step]}
      npc={{ texture: TextureKeys.WORKER_KEMAL, label: '👷 İŞÇİ KEMAL' }}
      speech={speech[step]}
      backdrop="kemal-park.webp"
      sound={sound}
      onToggleSound={() => setSound(!sound)}
      onClose={onClose}
      chips={[
        { icon: '🚰', label: step === 'done' ? 'Debi 15 L/sn' : 'Debi 25 L/sn', ok: step === 'done' },
        { icon: '🧱', label: aligned ? 'Yol israfı yok' : 'Fıskiyeler yola su basıyor', ok: aligned },
        { icon: '☀️', label: `Buharlaşma %${selectedHour?.loss ?? 28}`, ok: hour === 'morning' },
        { icon: '🌿', label: step === 'done' ? `+${WATER_SAVED_L} L tasarruf` : 'Tasarruf 0 L', ok: step === 'done' },
      ]}
    >
      {step === 'briefing' && (
        <section className="ws-panel">
          <h2>Sahada gördüklerimiz</h2>
          <ul className="ws-facts">
            <li>💧 Park her gün <b>25 litre</b> su alıyor.</li>
            <li>🧱 Fıskiyelerin yanındaki <b>taş yollar ve asfalt ıslak</b> — su çimlere gitmiyor.</li>
            <li>☀️ Sulama <b>öğle saatinde</b> yapılıyor; güneş suyu buharlaştırıyor.</li>
          </ul>
          <p className="ws-hint">
            Parkta 3 fıskiye var. Yanına git, <b>E</b> tuşuyla çevir. Su yola düşüyorsa yerde ⚠ yanar.
          </p>
          <button className="ws-btn primary" onClick={() => { playTone('tap', sound); onGoToField(); }}>
            🚿 Parka çık, fıskiyeleri düzelt →
          </button>
        </section>
      )}

      {step === 'hour' && (
        <section className="ws-panel">
          <h2>Hangi saatte sulamalıyız?</h2>
          <div className="ws-options">
            {HOURS.map((option) => {
              const state = hour === option.id ? (option.id === 'morning' ? 'right' : 'wrong') : '';
              return (
                <button
                  key={option.id}
                  className={`ws-option ${state}`}
                  onClick={() => pickHour(option)}
                  disabled={hour === 'morning' && option.id !== 'morning'}
                >
                  <span>{option.label}</span>
                  {hour === option.id && <small>%{option.loss} buharlaşma</small>}
                </button>
              );
            })}
          </div>
          {hour && hour !== 'morning' && (
            <p className="ws-hint" style={{ marginTop: 12 }}>Başka bir saat dene — en az kaybı bulmaya çalış.</p>
          )}
          <div className="ws-row-end">
            <button
              className="ws-btn primary"
              disabled={hour !== 'morning'}
              onClick={() => { playTone('win', sound); setStep('done'); }}
            >
              Sonucu gör →
            </button>
          </div>
        </section>
      )}

      {step === 'done' && (
        <section className="ws-panel ws-win">
          <div className="ws-medal" aria-hidden>🏅</div>
          <div>
            <h2>Yeşil Vaha Koruyucusu rozeti kazandın!</h2>
            <ul className="ws-facts">
              <li>🚿 3 fıskiyeyi <b>{field?.rotations ?? 0}</b> çevirmede düzelttin.</li>
              <li>☀️ Buharlaşma: <b>%28 → %4</b> (sabah 06:00)</li>
              <li>🌿 Günlük tasarruf: <b>{WATER_SAVED_L} litre</b></li>
            </ul>
            <p className="ws-hint">
              Öğrendiğin: Yeşil alanları susuz bırakmadan da su tasarrufu yapılabilir — doğru yön ve doğru saat yeter.
            </p>
            <button className="ws-btn primary" onClick={finish}>
              📋 Kanıtı deftere işle
            </button>
          </div>
        </section>
      )}
    </WorkshopShell>
  );
}
