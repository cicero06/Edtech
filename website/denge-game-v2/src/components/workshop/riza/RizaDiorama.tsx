/**
 * React host for the three.js diorama. Lazy-loaded (React.lazy) so three.js
 * only downloads when the student actually opens Rıza's workshop.
 */
import { useEffect, useRef } from 'react';
import { RizaScene, type AnchorId, type PickId } from './RizaScene';
import type { FarmState } from './sim';

export interface FloatingLabel {
  id: AnchorId;
  text: string;
  tone: 'target' | 'ok' | 'warn' | 'info';
}

interface Props {
  state: FarmState;
  labels: FloatingLabel[];
  onPick: (id: PickId) => void;
}

export default function RizaDiorama({ state, labels, onPick }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<RizaScene | null>(null);
  const pickRef = useRef(onPick);
  useEffect(() => {
    pickRef.current = onPick;
  }, [onPick]);
  /** Label elements exist before the scene does (child refs run first). */
  const labelEls = useRef(new Map<AnchorId, HTMLElement>());

  const bindLabel = (id: AnchorId) => (el: HTMLButtonElement | null) => {
    if (el) labelEls.current.set(id, el);
    else labelEls.current.delete(id);
    sceneRef.current?.attachLabel(id, el);
  };

  useEffect(() => {
    if (!hostRef.current) return;
    const scene = new RizaScene(hostRef.current, (id) => pickRef.current(id));
    sceneRef.current = scene;
    for (const [id, el] of labelEls.current) scene.attachLabel(id, el);
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setState(state);
  }, [state]);

  return (
    <div className="riza-stage">
      <div ref={hostRef} className="riza-canvas" />
      {labels.map((label) => (
        <button
          key={label.id}
          ref={bindLabel(label.id)}
          className={`riza-label ${label.tone}`}
          onClick={() => label.id !== 'riza' && onPick(label.id)}
          tabIndex={-1}
        >
          {label.text}
        </button>
      ))}
      <div className="riza-help" aria-hidden>
        🖱️ Sürükle: çevir · Tekerlek: yakınlaş · Nesneye tıkla: etkileşim
      </div>
      <button className="riza-reset" onClick={() => sceneRef.current?.resetView()}>
        ⟲ Görünümü sıfırla
      </button>
    </div>
  );
}
