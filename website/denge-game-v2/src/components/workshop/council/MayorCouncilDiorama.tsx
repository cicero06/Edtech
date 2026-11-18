/**
 * React host for the Three.js 3D Belediye Meclis Salonu (Council Chamber).
 * Lazy-loaded inside SolutionPanel so Three.js only runs when the council
 * meeting opens.
 */
import { useEffect, useRef } from 'react';
import {
  MayorCouncilScene,
  type CouncilAnchorId,
  type CouncilVisualState,
} from './MayorCouncilScene';
import type { SolutionId } from '../../../Game/scenario/model';

export interface CouncilFloatingBadge {
  id: CouncilAnchorId;
  name: string;
  statusText: string;
  tone: 'mayor' | 'active' | 'waiting';
  linkedSolutionId?: SolutionId;
}

interface Props {
  state: CouncilVisualState;
  badges: CouncilFloatingBadge[];
  onToggleSolution: (id: SolutionId) => void;
}

export default function MayorCouncilDiorama({ state, badges, onToggleSolution }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MayorCouncilScene | null>(null);
  const toggleRef = useRef(onToggleSolution);

  useEffect(() => {
    toggleRef.current = onToggleSolution;
  }, [onToggleSolution]);

  const badgeEls = useRef(new Map<CouncilAnchorId, HTMLElement>());

  const bindBadge = (id: CouncilAnchorId) => (el: HTMLButtonElement | null) => {
    if (el) badgeEls.current.set(id, el);
    else badgeEls.current.delete(id);
    sceneRef.current?.attachLabel(id, el);
  };

  useEffect(() => {
    if (!hostRef.current) return;
    const scene = new MayorCouncilScene(hostRef.current, (id) => toggleRef.current(id));
    sceneRef.current = scene;
    for (const [id, el] of badgeEls.current) scene.attachLabel(id, el);
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setState(state);
  }, [state]);

  return (
    <div className="council-3d-stage">
      <div ref={hostRef} className="council-3d-canvas" />
      {badges.map((b) => (
        <button
          key={b.id}
          ref={bindBadge(b.id)}
          type="button"
          className={`council-3d-badge tone-${b.tone}`}
          onClick={() => b.linkedSolutionId && onToggleSolution(b.linkedSolutionId)}
          tabIndex={-1}
        >
          <strong>{b.name}</strong>
          <span>{b.statusText}</span>
        </button>
      ))}
      <div className="council-3d-help" aria-hidden="true">
        🏛️ 3B Meclis Salonu · Sürükle: Çevir · Masadaki Makete veya Üyelere Tıkla: Paketi Seç
      </div>
      <button
        type="button"
        className="council-3d-reset"
        onClick={() => sceneRef.current?.resetView()}
      >
        ⟲ Kamerayı Sıfırla
      </button>
    </div>
  );
}
