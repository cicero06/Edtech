/**
 * Makes collecting the Kadim engraving stones visible (playtest: "we didn't
 * even notice we were collecting puzzle pieces").
 *
 * - StoneReward: when a district workshop finishes, the stone rises in the
 *   middle of the screen, shows which guardian gave it and what it stands
 *   for, then flies into the tracker.
 * - KadimTracker: four sockets under the notebook button; earned stones glow,
 *   and when all four are in, it points the student to the mayor.
 */
import { useEffect, useRef } from 'react';
import { KADIM_PIECES, type KadimPieceId } from '../Game/data/kadim';
import './KadimStones.css';

const MAP_URL = `${import.meta.env.BASE_URL}assets/workshops/kadim-map.webp`;
const QUADRANT: Record<string, string> = { nw: '0% 0%', ne: '100% 0%', sw: '0% 100%', se: '100% 100%' };

function StoneFace({ pieceId, size }: { pieceId: KadimPieceId; size: number }) {
  const piece = KADIM_PIECES.find((p) => p.id === pieceId)!;
  return (
    <span
      className="kst-face"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${MAP_URL})`,
        backgroundPosition: QUADRANT[piece.home],
      }}
      aria-hidden
    >
      <span className="kst-face-icon">{piece.icon}</span>
    </span>
  );
}

const REWARD_MS = 3400;

export function StoneReward({
  pieceId,
  count,
  onDone,
}: {
  pieceId: KadimPieceId;
  count: number;
  onDone: () => void;
}) {
  const piece = KADIM_PIECES.find((p) => p.id === pieceId)!;
  // The parent re-renders constantly (player movement) — keep one timer per stone.
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);
  useEffect(() => {
    const timer = window.setTimeout(() => done.current(), REWARD_MS);
    return () => window.clearTimeout(timer);
  }, [pieceId]);

  return (
    <div className="kst-reward" role="status" aria-live="polite" onClick={() => done.current()}>
      <div className="kst-reward-card">
        <div className="kst-rays" aria-hidden />
        <StoneFace pieceId={pieceId} size={132} />
        <div className="kst-reward-text">
          <div className="kst-eyebrow">KADİM GRAVÜR TAŞI · {count}/4</div>
          <strong>{piece.label} taşını kazandın!</strong>
          <span>{piece.guardian} sana kasabanın kadim su haritasının bir parçasını verdi.</span>
          <em>
            {count < 4
              ? `${4 - count} taş daha topla, sonra Başkan’a götür.`
              : 'Dört taş tamam! Önce Lina’ya raporunu ver; çözüm toplantısında Başkan haritayı isteyecek.'}
          </em>
        </div>
      </div>
    </div>
  );
}

export function KadimTracker({ collected, fresh }: { collected: KadimPieceId[]; fresh?: KadimPieceId | null }) {
  const complete = collected.length === KADIM_PIECES.length;
  return (
    <div
      className={`kst-tracker ${complete ? 'kst-complete' : ''}`}
      aria-label={`Kadim gravür taşları: ${collected.length}/4`}
      title={complete ? 'Dört taş tamam: çözüm toplantısında Başkan’a götür' : 'Kadim gravür taşları: her atölye bir taş verir'}
    >
      {KADIM_PIECES.map((piece) => {
        const has = collected.includes(piece.id);
        return (
          <span key={piece.id} className={`kst-socket ${has ? 'kst-has' : ''} ${fresh === piece.id ? 'kst-fresh' : ''}`}>
            {has ? <StoneFace pieceId={piece.id} size={30} /> : <span className="kst-empty">{piece.icon}</span>}
          </span>
        );
      })}
      {complete && <span className="kst-go">4/4 ✓</span>}
    </div>
  );
}
