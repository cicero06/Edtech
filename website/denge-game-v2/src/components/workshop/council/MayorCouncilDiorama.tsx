/**
 * React host for the full-stage Three.js 3D Belediye Meclis Salonu (Council Chamber).
 */
import { useEffect, useRef } from 'react';
import {
  MayorCouncilScene,
  type CouncilMemberId,
  type CouncilVisualState,
  type VoteLampState,
} from './MayorCouncilScene';
import type { SolutionId } from '../../../Game/scenario/model';

export interface CouncilFloatingBadge {
  id: CouncilMemberId;
  title: string;
  role: string;
  statusText: string;
  isSpeaking: boolean;
  vote: VoteLampState;
}

interface Props {
  state: CouncilVisualState;
  badges: CouncilFloatingBadge[];
  onToggleSolution: (id: SolutionId) => void;
  onSelectMember: (id: CouncilMemberId) => void;
}

const VOTE_PILL: Record<VoteLampState, string> = {
  idle: '',
  yes: '🟢 KABUL',
  caution: '🟡 ŞERHLİ ONAY',
};

export default function MayorCouncilDiorama({
  state,
  badges,
  onToggleSolution,
  onSelectMember,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MayorCouncilScene | null>(null);
  const toggleRef = useRef(onToggleSolution);
  const selectMemberRef = useRef(onSelectMember);

  useEffect(() => {
    toggleRef.current = onToggleSolution;
  }, [onToggleSolution]);

  useEffect(() => {
    selectMemberRef.current = onSelectMember;
  }, [onSelectMember]);

  const badgeEls = useRef(new Map<CouncilMemberId, HTMLElement>());

  const bindBadge = (id: CouncilMemberId) => (el: HTMLButtonElement | null) => {
    if (el) badgeEls.current.set(id, el);
    else badgeEls.current.delete(id);
    sceneRef.current?.attachLabel(id, el);
  };

  useEffect(() => {
    if (!hostRef.current) return;
    const scene = new MayorCouncilScene(
      hostRef.current,
      (id) => toggleRef.current(id),
      (id) => selectMemberRef.current(id),
    );
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
          className={`council-3d-badge${b.isSpeaking ? ' is-speaking' : ''}${
            b.vote !== 'idle' ? ` vote-${b.vote}` : ''
          }`}
          onClick={() => onSelectMember(b.id)}
          tabIndex={-1}
        >
          <span className="council-badge-role">{b.role}</span>
          <strong>
            {b.isSpeaking ? '🎤 ' : ''}
            {b.title}
          </strong>
          <span className="council-badge-status">{b.statusText}</span>
          {b.vote !== 'idle' && <em className="council-badge-vote">{VOTE_PILL[b.vote]}</em>}
        </button>
      ))}
      <div className="council-3d-help" aria-hidden="true">
        🖱️ Sürükle: Salonu Çevir · Masadaki Makete veya Komisyon Başkanlarına Tıkla: Söz Ver / Seç
      </div>
      <button
        type="button"
        className="council-3d-reset"
        onClick={() => sceneRef.current?.resetView()}
      >
        ⟲ Genel Görünüm
      </button>
    </div>
  );
}
