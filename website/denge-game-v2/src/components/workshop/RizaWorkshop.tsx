/**
 * Çiftçi Rıza's Bereket Vadisi workshop — web port of the Unity 3D drip
 * irrigation diorama (GameHUD.Riza.cs + RizaDiorama3DManager.cs). Replaces
 * the plain Tarım card.
 *
 *   briefing → 3D farm (5 Unity steps: main valve, sand filter, drip lines,
 *   gold PC nozzle on the sloped row, hydraulic balance) → badge
 *
 * Added for the web: before fitting the nozzle the student sees row 3 dry
 * out and answers *why* (hypothesis first, like Nuri's stages).
 * Metrics: hypothesis, over-pressure moments, wrong hours, regulator moves.
 */
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import type { MinigameResult } from '../../Game/data/minigames';
import { TextureKeys } from '../../Game/data/assets';
import { playTone } from './audio';
import WorkshopShell from './WorkshopShell';
import {
  HOLD_SECONDS,
  HOUR_INFO,
  INITIAL_FARM,
  MOISTURE_OK,
  OLD_HABITS,
  PRESSURE_MAX,
  PRESSURE_MIN,
  PRESSURE_OK,
  STEP_TITLES,
  currentStep,
  flowing,
  moistureOk,
  pressureOk,
  stepFarm,
  uniformity,
  type FarmState,
  type Hour,
} from './riza/sim';
import type { FloatingLabel } from './riza/RizaDiorama';
import type { PickId } from './riza/RizaScene';
import './RizaWorkshop.css';

const RizaDiorama = lazy(() => import('./riza/RizaDiorama'));

const WATER_SAVED_L = 25;
const ROW_NAMES = ['1. sıra', '2. sıra', '3. sıra (yokuş)'] as const;

const HYPOTHESIS = {
  prompt: 'Borular döşendi ama 3. sıradaki domatesler sararıyor. Nem göstergesine bak: neden sadece 3. sıra kuruyor?',
  options: [
    {
      label: 'A) Su az — basıncı sonuna kadar aç',
      feedback:
        'Basıncı artırırsak 1. ve 2. sıra balçık olur, 3. sıra yine de geride kalır. Sorun miktar değil, dağılım!',
    },
    {
      label: 'B) Sıra yokuşta ve uzak — basınç orada düşüyor',
      feedback:
        'Aynen öyle evlat! Yokuş ve uzaklık 3. sıradaki basıncı yarıya indiriyor. Basınç dengeleyici altın PC nozul her damlatıcıya aynı suyu verir.',
    },
    {
      label: 'C) Toprak bozuk — bitkileri değiştir',
      feedback:
        'Toprak sağlam; 1. ve 2. sıra aynı topraktayken yeşil. Fark yükseklikte ve uzaklıkta.',
    },
  ],
  correct: 1,
} as const;

interface Props {
  onComplete: (result: MinigameResult) => void;
  onClose: () => void;
}

type Phase = 'briefing' | 'farm' | 'done';

export default function RizaWorkshop({ onComplete, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('briefing');
  const [sound, setSound] = useState(true);
  const tone = (k: Parameters<typeof playTone>[0]) => playTone(k, sound);

  const [farm, setFarm] = useState<FarmState>(INITIAL_FARM);
  const [draining, setDraining] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const [note, setNote] = useState<{ text: string; warn: boolean } | null>(null);
  const metrics = useRef({ overPressure: 0, wrongHours: 0, regulatorMoves: 0, startedAt: 0 });

  const step = currentStep(farm);
  const isFlowing = flowing(farm);
  const unif = uniformity(farm.moisture);

  // Simulation clock: 10 Hz is plenty for moisture curves.
  useEffect(() => {
    if (phase !== 'farm') return;
    const id = setInterval(() => {
      setFarm((s) => {
        let next = stepFarm(s, 0.1);
        if (draining && next.sediment > 0) next = { ...next, sediment: Math.max(0, next.sediment - 0.07) };
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [phase, draining]);

  useEffect(() => {
    if (draining && farm.sediment === 0) {
      setDraining(false);
      say('Filtre tertemiz! Kum ve tortu tahliye edildi, su artık berrak akıyor.');
      tone('win');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draining, farm.sediment]);

  useEffect(() => {
    if (farm.won) tone('win');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farm.won]);

  // Transient notes fade after a few seconds.
  useEffect(() => {
    if (!note) return;
    const id = setTimeout(() => setNote(null), 4500);
    return () => clearTimeout(id);
  }, [note]);

  const say = (text: string, warn = false) => setNote({ text, warn });

  const setPressure = (p: number) => {
    const rounded = Math.round(p * 10) / 10;
    if (rounded > PRESSURE_OK[1] && farm.pressure <= PRESSURE_OK[1] && isFlowing) {
      metrics.current.overPressure += 1;
      say('Dikkat! Basınç çok yüksek — kökler balçık olur, borular zorlanır. 1.8 bar civarına indir.', true);
      tone('alert');
    }
    metrics.current.regulatorMoves += 1;
    setFarm((s) => ({ ...s, pressure: rounded }));
  };

  const setHour = (hour: Hour) => {
    if (hour === farm.hour) return;
    if (hour !== 'morning') {
      metrics.current.wrongHours += 1;
      say(HOUR_INFO[hour].note, true);
      tone('alert');
    } else {
      say(HOUR_INFO.morning.note);
      tone('tap');
    }
    setFarm((s) => ({ ...s, hour }));
  };

  const fitNozzle = () => {
    if (answer === null) {
      say('Önce düşünelim evlat: 3. sıra neden kuruyor? Sağdaki soruyu cevapla.', true);
      tone('alert');
      return;
    }
    setFarm((s) => ({ ...s, pcNozzle: true, pressure: OLD_HABITS.pressure, hour: OLD_HABITS.hour }));
    say(
      'Altın PC nozullar takıldı, test sulaması bitti! Ama regülatör benim eski alışkanlığıma döndü: 0.8 bar ve öğle 13:00. Sulama programını sen kur evlat!',
    );
    tone('win');
  };

  const pick = (id: PickId) => {
    if (phase !== 'farm' || farm.won) return;
    if (id === 'valve') {
      setFarm((s) => ({ ...s, valveOpen: !s.valveOpen }));
      if (!farm.valveOpen) say(farm.sediment > 0.05 ? 'Vana açıldı! Ama su filtrede takılıyor — kum filtresi tıkalı.' : 'Vana açıldı, su akıyor!');
      else say('Vana kapandı, su kesildi.', true);
      tone('tap');
    } else if (id === 'filter') {
      if (farm.sediment <= 0.05) return say('Filtre zaten temiz.');
      if (!farm.valveOpen) {
        tone('alert');
        return say('Filtreyi suyla yıkayarak boşaltırız — önce su kulesinin vanasını aç.', true);
      }
      setDraining(true);
      say('Tahliye kapağı açıldı, kum ve tortu dışarı akıyor…');
      tone('tap');
    } else if (id === 'regulator') {
      const next = farm.pressure < 1.4 ? 1.8 : farm.pressure < 2.2 ? 2.6 : 1.0;
      setPressure(next);
      if (next <= PRESSURE_OK[1]) tone('tap');
    } else {
      const r = Number(id.slice(3));
      if (!farm.pipes[r]) {
        if (step < 3) {
          tone('alert');
          return say('Önce su hattını hazırla: vana açık, filtre temiz olmalı.', true);
        }
        setFarm((s) => {
          const pipes = [...s.pipes] as FarmState['pipes'];
          pipes[r] = true;
          return { ...s, pipes };
        });
        say(`${ROW_NAMES[r]} damla borusu döşendi — su artık doğrudan köke gidiyor.`);
        tone('tap');
      } else if (r === 2 && !farm.pcNozzle && step === 4) {
        fitNozzle();
      }
    }
  };

  const finish = () => {
    const hypothesisCorrect = answer === HYPOTHESIS.correct ? 1 : 0;
    const m = metrics.current;
    const score = Math.max(40, Math.min(100, 100 - (hypothesisCorrect ? 0 : 15) - m.overPressure * 5 - m.wrongHours * 10));
    onComplete({
      gameId: 'riza',
      score,
      metrics: {
        waterSaved: WATER_SAVED_L,
        hypothesisCorrect,
        overPressure: m.overPressure,
        wrongHourPicks: m.wrongHours,
        regulatorMoves: m.regulatorMoves,
        seconds: Math.round((Date.now() - m.startedAt) / 1000),
        uniformity: Math.round(unif * 100),
      },
    });
  };

  // ---- Rıza's live voice (Unity's GetRizaLiveSimulationFeedback) ----------
  let speech: string;
  if (phase === 'briefing') {
    speech =
      'Hoş geldin evlat! Tarlayı yıllardır salma sulamayla suladık: su arklardan akar, yarısı toprağa, yarısı güneşe gider. Bu yıl Bereket Vadisi’nde damla sulama deneyeceğiz. Gel, pilot tarlayı birlikte kuralım!';
  } else if (phase === 'done') {
    speech = 'Yaşa be evlat! Köklerin hepsi eşit su alıyor; ne balçık var ne kuraklık. Bereket Vadisi Pilot Sulama Raporu hazır!';
  } else if (note) {
    speech = note.text;
  } else if (farm.won) {
    speech = 'Sistem 3 saniye dengede kaldı! Bereket Vadisi başardı — aşağıdan raporu kaydet.';
  } else if (step === 1) {
    speech = 'Önce su kulesinin kırmızı ana vanasını aç. Kuleye tıkla ya da sağdaki butonu kullan.';
  } else if (step === 2) {
    speech = 'Vana açık ama kum filtresi tıkalı! Şeffaf siklon filtreye tıkla, tortuyu tahliye et.';
  } else if (step === 3) {
    speech = `Filtre berrak! Şimdi tarladaki 3 sıraya damla borusu döşe (${farm.pipes.filter(Boolean).length}/3). Sıraya tıkla — ben de 1.8 bar ile test sulaması yapıyorum.`;
  } else if (step === 4) {
    speech =
      answer === null
        ? 'Test sulaması çalışıyor: 1. ve 2. sıra yeşeriyor… ama 3. sıraya bak! Domatesler sararıyor, nem düşük. Sence neden?'
        : HYPOTHESIS.options[answer].feedback;
  } else if (!pressureOk(farm.pressure)) {
    speech =
      farm.pressure < PRESSURE_OK[0]
        ? 'Basınç çok düşük, damlatıcılara su yetişmiyor. Regülatörü 1.8 bar civarına getir.'
        : 'Basınç çok yüksek, kökler balçık olacak! Regülatörü 1.8 bar civarına indir.';
  } else if (farm.hour !== 'morning') {
    speech = `${HOUR_INFO[farm.hour].note} Sulama saatini sabah serinliğine al.`;
  } else if (farm.hold > 0) {
    speech = `Harika! Sistem dengede, kökler nefes alıyor. Dengeyi koru: ${(HOLD_SECONDS - farm.hold).toFixed(1)} sn…`;
  } else {
    speech = `Kök nem göstergelerini izle: 3 sıranın nemi de yeşil banda (%${MOISTURE_OK[0] * 100}–%${MOISTURE_OK[1] * 100}) gelmeli.`;
  }

  const labels = useMemo<FloatingLabel[]>(() => {
    if (phase !== 'farm') return [];
    const out: FloatingLabel[] = [];
    if (step === 1) out.push({ id: 'valve', text: '👉 1. Ana vanayı aç', tone: 'target' });
    if (step === 2) out.push({ id: 'filter', text: draining ? '⏳ Tahliye ediliyor…' : '👉 2. Filtreyi boşalt', tone: 'target' });
    if (step === 3) {
      farm.pipes.forEach((laid, r) => {
        if (!laid) out.push({ id: `row${r}` as PickId, text: `👉 ${r + 1}. sıraya boru döşe`, tone: 'target' });
      });
    }
    if (step >= 4) {
      farm.moisture.forEach((m, r) => {
        const okRow = moistureOk(m);
        const text =
          step === 4 && r === 2 && answer !== null
            ? '👉 Altın PC nozul tak'
            : `${okRow ? '🌱' : m < MOISTURE_OK[0] ? '🥀' : '💦'} Nem %${Math.round(m * 100)}`;
        out.push({
          id: `row${r}` as PickId,
          text,
          tone: step === 4 && r === 2 && answer !== null ? 'target' : okRow ? 'ok' : 'warn',
        });
      });
    }
    if (step >= 4) {
      out.push({
        id: 'regulator',
        text: `🧭 ${farm.pressure.toFixed(1)} bar`,
        tone: step === 5 && !pressureOk(farm.pressure) ? 'target' : pressureOk(farm.pressure) ? 'ok' : 'info',
      });
    }
    return out;
  }, [phase, step, draining, farm.pipes, farm.moisture, farm.pressure, answer]);

  const stepLabel =
    phase === 'briefing' ? 'ADIM 1 · SAHA GÖZLEMİ' : phase === 'farm' ? `PİLOT TARLA · AŞAMA ${Math.min(step, 5)}/5` : 'GÖREV TAMAMLANDI';

  return (
    <WorkshopShell
      theme="riza"
      eyebrow="HARMONY TOWN · BEREKET VADİSİ PİLOT TARLASI"
      title="Çiftçi Rıza’nın Damla Sulama Atölyesi"
      stepLabel={stepLabel}
      npc={{ texture: TextureKeys.FARMER_RIZA, label: '👨‍🌾 ÇİFTÇİ RIZA' }}
      speech={speech}
      alert={!!note?.warn}
      backdrop="riza-farm.webp"
      sound={sound}
      onToggleSound={() => setSound(!sound)}
      onClose={onClose}
      chips={[
        { icon: '🚰', label: isFlowing ? 'Su akıyor' : farm.valveOpen ? 'Filtre tıkalı' : 'Vana kapalı', ok: isFlowing },
        { icon: '🧭', label: `Basınç ${farm.pressure.toFixed(1)} bar`, ok: pressureOk(farm.pressure) },
        {
          icon: '⚖️',
          label: farm.pipes.every(Boolean) ? `Dağılım %${Math.round(unif * 100)}` : 'Dağılım —',
          ok: unif >= 0.85 && farm.pipes.every(Boolean) && farm.pcNozzle,
        },
        { icon: '☀️', label: `Buharlaşma %${HOUR_INFO[farm.hour].loss}`, ok: farm.hour === 'morning' },
      ]}
    >
      {phase === 'briefing' && (
        <section className="ws-panel">
          <h2>Tarlada gördüklerimiz</h2>
          <ul className="ws-facts">
            <li>🌊 <b>Salma sulama</b>: su arklardan tarlaya yayılıyor, büyük kısmı köke ulaşmadan kayboluyor.</li>
            <li>⛰️ Pilot tarlanın <b>3. sırası yokuşta</b> ve su kulesinden en uzak sıra.</li>
            <li>☀️ Sulama şimdiye kadar <b>öğle sıcağında</b> yapıldı.</li>
          </ul>
          <p className="ws-hint">
            3D tarlayı fareyle sürükleyerek çevirebilir, tekerlekle yakınlaştırabilirsin. Nesnelere tıklayarak çalıştır.
          </p>
          <button
            className="ws-btn primary"
            onClick={() => {
              metrics.current.startedAt = Date.now();
              setPhase('farm');
              tone('tap');
            }}
          >
            🌱 Pilot tarlaya geç →
          </button>
        </section>
      )}

      {phase === 'farm' && (
        <div className="riza-layout">
          <Suspense fallback={<div className="riza-stage riza-loading">3D tarla hazırlanıyor…</div>}>
            <RizaDiorama state={farm} labels={labels} onPick={pick} />
          </Suspense>

          <aside className="riza-console">
            <ol className="riza-steps">
              {STEP_TITLES.map((title, i) => (
                <li key={title} className={i + 1 < step ? 'done' : i + 1 === step ? 'active' : ''}>
                  <span>{i + 1 < step ? '✓' : i + 1}</span>
                  {title}
                </li>
              ))}
            </ol>

            <div className="riza-moisture" aria-label="Kök nemi">
              <div className="riza-moisture-head">
                <b>Kök bölgesi nemi</b>
                <small>yeşil bant = ideal (%{MOISTURE_OK[0] * 100}–%{MOISTURE_OK[1] * 100})</small>
              </div>
              {farm.moisture.map((m, r) => (
                <div key={r} className="riza-bar">
                  <span className="riza-bar-name">{ROW_NAMES[r]}</span>
                  <span className="riza-bar-track">
                    <span className="riza-bar-band" style={{ left: `${MOISTURE_OK[0] * 100}%`, width: `${(MOISTURE_OK[1] - MOISTURE_OK[0]) * 100}%` }} />
                    <span className={`riza-bar-fill ${moistureOk(m) ? 'ok' : m < MOISTURE_OK[0] ? 'dry' : 'wet'}`} style={{ width: `${m * 100}%` }} />
                  </span>
                  <span className="riza-bar-val">%{Math.round(m * 100)}</span>
                </div>
              ))}
            </div>

            {step === 1 && (
              <button className="ws-btn primary riza-action" onClick={() => pick('valve')}>🔴 Ana vanayı aç</button>
            )}
            {step === 2 && (
              <button className="ws-btn primary riza-action" disabled={draining} onClick={() => pick('filter')}>
                {draining ? `⏳ Tahliye %${Math.round((1 - farm.sediment) * 100)}` : '🧹 Kum filtresini boşalt'}
              </button>
            )}
            {step === 3 && (
              <div className="riza-row-buttons">
                {farm.pipes.map((laid, r) => (
                  <button key={r} className="ws-btn riza-action" disabled={laid} onClick={() => pick(`row${r}` as PickId)}>
                    {laid ? '✓' : '🌱'} {ROW_NAMES[r]}
                  </button>
                ))}
              </div>
            )}
            {step === 4 && (
              <div className="riza-hypo">
                <div className="riza-hypo-q">🔬 {HYPOTHESIS.prompt}</div>
                <div className="riza-hypo-options">
                  {HYPOTHESIS.options.map((o, i) => (
                    <button
                      key={o.label}
                      className={`ws-option ${answer === i ? (i === HYPOTHESIS.correct ? 'right' : 'wrong') : ''}`}
                      disabled={answer !== null}
                      onClick={() => {
                        setAnswer(i);
                        tone(i === HYPOTHESIS.correct ? 'win' : 'tap');
                      }}
                    >
                      <span>{o.label}</span>
                    </button>
                  ))}
                </div>
                <button className="ws-btn primary riza-action" disabled={answer === null} onClick={fitNozzle}>
                  ⭐ 3. sıraya altın PC nozul tak
                </button>
              </div>
            )}
            {step >= 5 && (
              <div className="riza-controls">
                <label className="riza-pressure">
                  <span>
                    Basınç regülatörü: <b>{farm.pressure.toFixed(1)} bar</b>
                    <small> (hedef {PRESSURE_OK[0]}–{PRESSURE_OK[1]})</small>
                  </span>
                  <input
                    type="range"
                    min={PRESSURE_MIN}
                    max={PRESSURE_MAX}
                    step={0.1}
                    value={farm.pressure}
                    disabled={farm.won}
                    onChange={(e) => setPressure(Number(e.target.value))}
                  />
                </label>
                <div className="riza-hours">
                  {(Object.keys(HOUR_INFO) as Hour[]).map((h) => (
                    <button
                      key={h}
                      className={`ws-option ${farm.hour === h ? (h === 'morning' ? 'right' : 'wrong') : ''}`}
                      disabled={farm.won}
                      onClick={() => setHour(h)}
                    >
                      <span>{HOUR_INFO[h].label}</span>
                      <small>%{HOUR_INFO[h].loss} kayıp</small>
                    </button>
                  ))}
                </div>
                <div className="riza-hold">
                  <span>Denge</span>
                  <span className="riza-hold-track">
                    <span style={{ width: `${(Math.min(farm.hold, HOLD_SECONDS) / HOLD_SECONDS) * 100}%` }} />
                  </span>
                </div>
              </div>
            )}

            <button className="ws-btn primary riza-action" disabled={!farm.won} onClick={() => { tone('tap'); setPhase('done'); }}>
              {farm.won ? '🏆 Sonucu gör →' : 'Denge sağlanınca açılır'}
            </button>
          </aside>
        </div>
      )}

      {phase === 'done' && (
        <section className="ws-panel ws-win">
          <img className="riza-win-art" src={`${import.meta.env.BASE_URL}assets/workshops/riza-badge.webp`} alt="" />
          <div>
            <h2>Bereket Vadisi Koruyucusu rozeti kazandın!</h2>
            <ul className="ws-facts">
              <li>💧 Damla sulama ile <b>%{WATER_SAVED_L}</b> daha az su — su doğrudan köke gidiyor.</li>
              <li>⚖️ Su dağılımı: <b>%{Math.round(unif * 100)}</b> eşit (yokuştaki sıra dahil)</li>
              <li>🧭 Basınç <b>{farm.pressure.toFixed(1)} bar</b>, sulama <b>sabah 06:00</b></li>
            </ul>
            <p className="ws-hint">
              Öğrendiğin: Su tasarrufu sadece “az su” değil — suyu doğru yere, doğru basınçla ve doğru saatte vermek.
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
