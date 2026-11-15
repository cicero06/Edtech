/**
 * Kadim Uyum Haritası — web port of the Unity side quest
 * (GameHUD.AncientPuzzle.cs), redesigned around systems thinking:
 *
 *   1. place    — four engraving stones (one per workshop) go to the slot
 *                 whose clue they match ("suyun doğduğu yer"…)
 *   2. connect  — the stones arrive turned; rotate them until the carved
 *                 channels carry water from the dam to every district
 *   3. predict  — Lina: the dam drops to 20 %, what do we protect first?
 *                 Answer + 1–5 confidence, then the explanation
 *   4. done     — Kadim Uyum Pınarı, title, present to the mayor
 *
 * Every move is written to the decision trace (data/decisions.ts) so the
 * teacher sees how the student got there, not only that they finished.
 * Tiered hints replace Unity's auto-assemble button.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KADIM_IDLE_HINT_MS,
  KADIM_PIECES,
  KADIM_PREDICTIONS,
  KADIM_SCRAMBLE,
  KADIM_SLOTS,
  KADIM_TITLE,
  wetPieces,
  type KadimDir,
  type KadimPiece,
  type KadimPieceId,
  type KadimSlot,
} from '../../Game/data/kadim';
import { recordDecision, type KadimResult } from '../../Game/data/session';
import { TextureKeys } from '../../Game/data/assets';
import { playTone } from './audio';
import WorkshopShell from './WorkshopShell';
import './KadimPuzzle.css';

type Phase = 'place' | 'connect' | 'predict' | 'done';

const STEP_LABEL: Record<Phase, string> = {
  place: 'ADIM 1 · TAŞLARI YERLEŞTİR',
  connect: 'ADIM 2 · KANALLARI BAĞLA',
  predict: 'ADIM 3 · TAHMİN',
  done: 'GİZEM ÇÖZÜLDÜ',
};

const MAP_URL = `${import.meta.env.BASE_URL}assets/workshops/kadim-map.webp`;
const QUADRANT: Record<KadimSlot, string> = { nw: '0% 0%', ne: '100% 0%', sw: '0% 100%', se: '100% 100%' };
/** End point of a channel groove inside the 100×100 piece box. */
const CHANNEL_END: Record<KadimDir, [number, number]> = {
  top: [50, 0],
  right: [100, 50],
  bottom: [50, 100],
  left: [0, 50],
};

/** Wall clock for the decision trace — only ever read from effects and handlers. */
const clock = () => Date.now();

const ZERO_ROTATIONS: Record<KadimPieceId, number> = { baraj: 0, konut: 0, tarla: 0, park: 0 };
const MIN_ROTATIONS = Object.values(KADIM_SCRAMBLE).reduce((sum, r) => sum + ((4 - r) % 4), 0);
const CONFIDENCE_LABELS = ['Hiç emin değilim', 'Pek emin değilim', 'Kararsızım', 'Eminim', 'Çok eminim'];

interface Props {
  onComplete: (result: KadimResult) => void;
  onClose: () => void;
}

function Stone({
  piece,
  rotation,
  wet,
  drought,
}: {
  piece: KadimPiece;
  rotation: number;
  wet: boolean;
  /** Reveal view: how much water this stone still gets with the dam at 20 %. */
  drought?: 'full' | 'thin' | 'dry';
}) {
  const flow = drought ?? (wet ? 'full' : 'dry');
  return (
    <div
      className={`kd-stone kd-flow-${flow}`}
      style={{
        backgroundImage: `url(${MAP_URL})`,
        backgroundPosition: QUADRANT[piece.home],
        transform: `rotate(${rotation * 90}deg)`,
      }}
    >
      <svg className="kd-channels" viewBox="0 0 100 100" aria-hidden>
        {piece.channels.map((dir) => {
          const [x, y] = CHANNEL_END[dir];
          return (
            <g key={dir}>
              <line className="kd-groove" x1="50" y1="50" x2={x} y2={y} />
              <line className="kd-water" x1="50" y1="50" x2={x} y2={y} />
            </g>
          );
        })}
        <circle className="kd-hub" cx="50" cy="50" r="13" />
      </svg>
      <span className="kd-icon" aria-hidden>{piece.icon}</span>
      <span className="kd-tag">{piece.label}</span>
    </div>
  );
}

export default function KadimPuzzle({ onComplete, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('place');
  const [sound, setSound] = useState(true);
  const [placed, setPlaced] = useState<Partial<Record<KadimSlot, KadimPieceId>>>({});
  const [selected, setSelected] = useState<KadimPieceId | null>(null);
  const [rotations, setRotations] = useState<Record<KadimPieceId, number>>(ZERO_ROTATIONS);
  const [speech, setSpeech] = useState(
    'Kâşif! Dört koruyucunun gravür taşlarını topladın. Bunlar kasabanın kadim su haritasının parçaları. Her taşı, ipucuna uyan yuvaya yerleştir.',
  );
  const [shake, setShake] = useState<KadimSlot | null>(null);
  const [hintTier, setHintTier] = useState(0);
  const [glowSlot, setGlowSlot] = useState<KadimSlot | null>(null);
  const [glowPiece, setGlowPiece] = useState<KadimPieceId | null>(null);
  const [idle, setIdle] = useState(false);
  const [prediction, setPrediction] = useState<KadimPieceId | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const counters = useRef({ placeTries: 0, placeWrong: 0, rotations: 0, hints: 0 });
  const startedAt = useRef(0);
  const phaseAt = useRef(0);
  const lastActionAt = useRef(0);

  // Clocks start when the puzzle opens (refs can't read time during render).
  useEffect(() => {
    const now = clock();
    startedAt.current = now;
    phaseAt.current = now;
    lastActionAt.current = now;
  }, []);

  // No water while stones are still being placed — it starts flowing in the connect phase.
  const wet = useMemo(
    () => (phase === 'place' ? new Set<KadimPieceId>() : wetPieces(rotations)),
    [phase, rotations],
  );
  const connected = wet.size === KADIM_PIECES.length;
  const tray = KADIM_PIECES.filter((p) => !Object.values(placed).includes(p.id));

  // Idle nudge: the hint button pulses after 45 s without progress.
  useEffect(() => {
    if (phase !== 'place' && phase !== 'connect') return;
    const timer = window.setInterval(() => {
      setIdle(clock() - lastActionAt.current > KADIM_IDLE_HINT_MS);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const sinceLast = () => {
    const now = clock();
    const ms = now - lastActionAt.current;
    lastActionAt.current = now;
    setIdle(false);
    return ms;
  };

  const enterPhase = (next: Phase, finished: Phase) => {
    recordDecision('kadim', 'phase_done', finished, clock() - phaseAt.current);
    phaseAt.current = clock();
    lastActionAt.current = clock();
    setHintTier(0);
    setGlowSlot(null);
    setGlowPiece(null);
    setIdle(false);
    setPhase(next);
  };

  // ---- phase 1: place ---------------------------------------------------------
  const placePiece = (pieceId: KadimPieceId, slot: KadimSlot, viaHint = false) => {
    const piece = KADIM_PIECES.find((p) => p.id === pieceId)!;
    const ms = sinceLast();
    counters.current.placeTries += 1;
    const ok = piece.home === slot;
    if (!viaHint) recordDecision('kadim', 'piece_placed', `${pieceId}@${slot}:${ok ? 'ok' : 'wrong'}`, ms);
    if (!ok) {
      counters.current.placeWrong += 1;
      playTone('alert', sound);
      setShake(slot);
      window.setTimeout(() => setShake(null), 450);
      const clue = KADIM_SLOTS.find((s) => s.id === slot)!.clue.toLowerCase();
      setSpeech(`${piece.icon} ${piece.label} taşı buraya oturmadı. Bu yuva “${clue}”. ${piece.label} kasabanın su yolculuğunda nerede duruyor?`);
      return;
    }
    playTone('tap', sound);
    const next = { ...placed, [slot]: pieceId };
    setPlaced(next);
    setSelected(null);
    setGlowSlot(null);
    setGlowPiece(null);
    if (Object.keys(next).length === KADIM_PIECES.length) {
      playTone('win', sound);
      setRotations({ ...KADIM_SCRAMBLE });
      setSpeech(
        'Taşlar yerinde! Ama zaman onları döndürmüş, kanallar birbirine bağlanmıyor. Taşlara tıklayıp döndür; su barajdan doğup bütün kasabaya ulaşmalı.',
      );
      enterPhase('connect', 'place');
    } else {
      setSpeech(`${piece.icon} ${piece.guardian}: “${piece.learned}” Doğru yuva! Sıradaki taşı seç.`);
    }
  };

  // ---- phase 2: connect -------------------------------------------------------
  const rotate = (pieceId: KadimPieceId, viaHint = false) => {
    if (connected) return;
    const ms = sinceLast();
    const nextRot = viaHint ? 0 : (rotations[pieceId] + 1) % 4;
    if (!viaHint) {
      counters.current.rotations += 1;
      recordDecision('kadim', 'piece_rotated', `${pieceId}:${nextRot}`, ms);
    }
    const next = { ...rotations, [pieceId]: nextRot };
    setRotations(next);
    setGlowPiece(null);
    if (wetPieces(next).size === KADIM_PIECES.length) {
      playTone('win', sound);
      setSpeech('Su akıyor! Barajdan doğan su evlere, tarlaya ve parka ulaştı. Hepsi aynı kaynağa bağlı, tek bir sistem.');
    } else {
      playTone('tap', sound);
    }
  };

  // ---- hints (3 tiers per phase) ----------------------------------------------
  const takeHint = () => {
    const tier = Math.min(hintTier + 1, 3);
    setHintTier(tier);
    counters.current.hints += 1;
    recordDecision('kadim', 'hint_used', `${phase}:${tier}`, sinceLast());
    playTone('tap', sound);
    if (phase === 'place') {
      const target = (selected && tray.find((p) => p.id === selected)) || tray[0];
      if (!target) return;
      if (tier === 1) {
        setSpeech('İpucu: Su yolculuğunu düşün. Su önce nerede toplanır, sonra borularla nereye gider, en son neyi sular?');
      } else if (tier === 2) {
        setSelected(target.id);
        setGlowSlot(target.home);
        setSpeech(`İpucu: ${target.icon} ${target.label} taşının yuvası parlıyor.`);
      } else {
        placePiece(target.id, target.home, true);
      }
    } else if (phase === 'connect') {
      const wrong = KADIM_PIECES.find((p) => rotations[p.id] !== 0);
      if (!wrong) return;
      if (tier === 1) {
        setSpeech('İpucu: Taşın üstündeki resim düz durunca kanalları da doğru yöne bakar. Evlerin çatıları yukarı baksın!');
      } else if (tier === 2) {
        setGlowPiece(wrong.id);
        setSpeech(`İpucu: ${wrong.icon} ${wrong.label} taşı ters duruyor. Ona tıklayarak döndür.`);
      } else {
        rotate(wrong.id, true);
        setSpeech(`${wrong.icon} ${wrong.label} taşını senin için düzelttim. Gerisini sen bağla!`);
      }
    }
  };

  // ---- phase 3: predict -------------------------------------------------------
  const reveal = () => {
    if (!prediction || confidence === null) return;
    const ms = sinceLast();
    recordDecision('kadim', 'prediction_made', prediction, ms);
    recordDecision('kadim', 'confidence_given', confidence);
    const pick = KADIM_PREDICTIONS.find((p) => p.id === prediction)!;
    playTone(pick.correct ? 'win' : 'tap', sound);
    setSpeech(pick.feedback);
    setRevealed(true);
  };

  const score = () => {
    const c = counters.current;
    const extraTurns = Math.max(0, c.rotations - MIN_ROTATIONS);
    return Math.max(40, Math.min(100, 100 - c.placeWrong * 5 - c.hints * 8 - extraTurns));
  };

  const finish = () => {
    const c = counters.current;
    const total = clock() - startedAt.current;
    const pick = KADIM_PREDICTIONS.find((p) => p.id === prediction);
    const result: KadimResult = {
      solved: true,
      placeTries: c.placeTries,
      placeWrong: c.placeWrong,
      rotations: c.rotations,
      minRotations: MIN_ROTATIONS,
      hints: c.hints,
      seconds: Math.round(total / 1000),
      prediction: prediction ?? '',
      predictionCorrect: !!pick?.correct,
      confidence: confidence ?? 0,
      score: score(),
    };
    recordDecision('kadim', 'completed', result.score, total);
    onComplete(result);
  };

  const close = () => {
    if (phase !== 'done') recordDecision('kadim', 'phase_done', `${phase}:closed`, clock() - phaseAt.current);
    onClose();
  };

  const placedCount = Object.keys(placed).length;
  const mayor = { texture: TextureKeys.MAYOR, label: '🏛️ BAŞKAN ADİL' };
  const lina = { texture: TextureKeys.LINA, label: '🔎 LİNA' };

  const board = (mode: 'play' | 'drought') => (
    <div className={`kd-board ${connected ? 'kd-solved' : ''}`}>
      <div className="kd-source" aria-hidden>
        <span>🏞️ Baraj gölü</span>
      </div>
      {KADIM_SLOTS.map((slot) => {
        const pieceId = placed[slot.id];
        const piece = pieceId ? KADIM_PIECES.find((p) => p.id === pieceId)! : null;
        const classes = [
          'kd-slot',
          `kd-${slot.id}`,
          shake === slot.id ? 'kd-shake' : '',
          glowSlot === slot.id ? 'kd-glow' : '',
          piece && glowPiece === piece.id ? 'kd-glow' : '',
          !piece && selected ? 'kd-target' : '',
        ].join(' ');
        if (piece) {
          const drought =
            mode === 'drought' ? (piece.id === 'park' ? 'dry' : piece.id === 'tarla' ? 'thin' : 'full') : undefined;
          return (
            <button
              key={slot.id}
              className={classes}
              disabled={phase !== 'connect' || connected}
              onClick={() => rotate(piece.id)}
              aria-label={`${piece.label} taşı${phase === 'connect' ? ', döndürmek için tıkla' : ''}`}
            >
              <Stone piece={piece} rotation={rotations[piece.id]} wet={wet.has(piece.id)} drought={drought} />
            </button>
          );
        }
        return (
          <button
            key={slot.id}
            className={classes}
            disabled={!selected}
            onClick={() => selected && placePiece(selected, slot.id)}
            aria-label={`${slot.compass} yuvası: ${slot.clue}`}
          >
            <span className="kd-compass">{slot.compass}</span>
            <span className="kd-clue">{slot.clue}</span>
          </button>
        );
      })}
    </div>
  );

  const hintButton = (
    <button className={`ws-btn kd-hint ${idle ? 'kd-pulse' : ''}`} onClick={takeHint} disabled={hintTier >= 3}>
      💡 İpucu ({Math.min(hintTier + 1, 3)}/3)
    </button>
  );

  return (
    <WorkshopShell
      theme="kadim"
      eyebrow="HARMONY TOWN · BELEDİYE ARŞİVİ"
      title="Kadim Uyum Haritası"
      stepLabel={STEP_LABEL[phase]}
      npc={phase === 'predict' ? lina : mayor}
      speech={speech}
      sound={sound}
      onToggleSound={() => setSound(!sound)}
      onClose={close}
      chips={[
        { icon: '🪨', label: `Taş ${placedCount}/4`, ok: placedCount === 4 },
        { icon: '💧', label: `Kanal ${phase === 'place' ? 0 : wet.size}/4`, ok: connected },
        { icon: '🔮', label: revealed ? 'Tahmin yapıldı' : 'Tahmin bekleniyor', ok: revealed },
        { icon: '🏛️', label: phase === 'done' ? 'Pınar açığa çıktı' : 'Gizem çözülmedi', ok: phase === 'done' },
      ]}
    >
      {phase === 'place' && (
        <section className="ws-panel kd-layout">
          {board('play')}
          <div className="kd-side">
            <h2>Gravür taşları</h2>
            <p className="ws-hint">Bir taş seç, sonra ipucuna uyan yuvaya tıkla.</p>
            <div className="kd-tray">
              {tray.map((piece) => (
                <button
                  key={piece.id}
                  className={`kd-tray-item ${selected === piece.id ? 'kd-selected' : ''}`}
                  onClick={() => {
                    playTone('tap', sound);
                    setSelected(piece.id);
                  }}
                >
                  <span className="kd-tray-icon" aria-hidden>{piece.icon}</span>
                  <span>
                    <b>{piece.label}</b>
                    <small>{piece.guardian}</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="ws-row-end">{hintButton}</div>
          </div>
        </section>
      )}

      {phase === 'connect' && (
        <section className="ws-panel kd-layout">
          {board('play')}
          <div className="kd-side">
            <h2>{connected ? 'Kanallar birleşti!' : 'Taşları döndür'}</h2>
            <ul className="ws-facts">
              {KADIM_PIECES.map((p) => (
                <li key={p.id} className={wet.has(p.id) ? 'kd-ok' : ''}>
                  {wet.has(p.id) ? '💧' : '◌'} {p.icon} {p.label}
                </li>
              ))}
            </ul>
            <div className="ws-row-end">
              {!connected && hintButton}
              {connected && (
                <button
                  className="ws-btn primary"
                  onClick={() => {
                    setSpeech(
                      'Haritayı birleştirdin, Kâşif. Şimdi bir düşünelim: kuraklık geldi, baraj %20’ye düştü. Su hepsine yetmiyor. Sence önce hangisini korumalıyız?',
                    );
                    enterPhase('predict', 'connect');
                  }}
                >
                  Lina’nın sorusuna geç →
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {phase === 'predict' && (
        <section className="ws-panel kd-layout">
          {board(revealed ? 'drought' : 'play')}
          <div className="kd-side">
            <h2>Baraj %20’ye düşerse önce nereyi korumalıyız?</h2>
            <div className="ws-options kd-options">
              {KADIM_PREDICTIONS.map((option) => {
                // After the reveal the protected-first answer turns green; a different
                // pick stays gold ("your choice") — explained, never marked red.
                const mine = prediction === option.id;
                const state = revealed && option.correct ? 'right' : mine ? 'kd-picked' : '';
                return (
                  <button
                    key={option.id}
                    className={`ws-option ${state}`}
                    disabled={revealed}
                    onClick={() => setPrediction(option.id)}
                  >
                    {option.label}
                    {revealed && mine && <small>Senin seçimin</small>}
                    {revealed && option.correct && !mine && <small>Önce korunması gereken</small>}
                  </button>
                );
              })}
            </div>
            <h2 className="kd-conf-title">Ne kadar eminsin?</h2>
            <div className="kd-confidence" role="radiogroup" aria-label="Ne kadar eminsin?">
              {CONFIDENCE_LABELS.map((label, i) => (
                <button
                  key={label}
                  role="radio"
                  aria-checked={confidence === i + 1}
                  className={`kd-conf ${confidence === i + 1 ? 'kd-picked' : ''}`}
                  disabled={revealed}
                  onClick={() => setConfidence(i + 1)}
                  title={label}
                >
                  <b>{i + 1}</b>
                  <small>{label}</small>
                </button>
              ))}
            </div>
            {revealed && (
              <p className="ws-hint kd-reveal">
                Haritada gör: 🏠 evlere su gidiyor, 🌾 tarlaya ince bir damla, 🌳 parkın kanalı kurudu. Sistemin bir parçası
                azalınca, kararımız diğerlerini de etkiler.
              </p>
            )}
            <div className="ws-row-end">
              {!revealed ? (
                <button className="ws-btn primary" disabled={!prediction || confidence === null} onClick={reveal}>
                  Cevabımı gör →
                </button>
              ) : (
                <button
                  className="ws-btn primary"
                  onClick={() => {
                    playTone('win', sound);
                    setSpeech(
                      '“Dağ barajından inen su, şebekeden geçerek evlere, tarlaya ve parka ulaşır. Bu dört bölge uyum içinde olduğunda kasaba kuraklık yüzü görmez.” Kadim Uyum Pınarı’nın sırrı buymuş!',
                    );
                    enterPhase('done', 'predict');
                  }}
                >
                  Pınarı aç →
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {phase === 'done' && (
        <section className="ws-panel ws-win">
          <div className="ws-medal" aria-hidden>⛲</div>
          <div>
            <h2>Kadim Uyum Pınarı açığa çıktı!</h2>
            <ul className="ws-facts">
              <li>🪨 4 gravür taşını yerine koydun ve kanalları birleştirdin.</li>
              <li>💧 Barajdan doğan su evlere, tarlaya ve parka ulaşıyor: hepsi tek bir sistem.</li>
              <li>🏅 “{KADIM_TITLE}” unvanını kazandın.</li>
            </ul>
            <p className="ws-hint">
              Öğrendiğin: Kasabanın suyu tek bir kaynaktan doğar. Bir yerde yaptığın değişiklik diğer bölgeleri de etkiler;
              çözüm planını bunu düşünerek kur.
            </p>
            <button className="ws-btn primary" onClick={finish}>
              🏛️ Haritayı Başkan’a sun ve plana geç
            </button>
          </div>
        </section>
      )}
    </WorkshopShell>
  );
}
