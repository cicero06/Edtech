import { useCallback, useEffect, useRef, useState } from 'react';
import { INTRO_ART, INTRO_VIDEOS, type IntroStage } from '../Game/data/intro';
import { SPRITESHEET_ASSETS, type TextureKey } from '../Game/data/assets';
import type { StudentProfile } from '../Game/data/session';
import MaskedVideo from './MaskedVideo';
import StudentGate from './StudentGate';

type IntroSequenceProps = {
  stage: Exclude<IntroStage, 'complete'>;
  onContinue: () => void;
  /** Login: the student picked their card on the roster screen. */
  onStudent: (student: StudentProfile) => void;
  /** A previous session exists - resume straight into the game. */
  savedName?: string;
  onResume?: () => void;
  /** Way out of the login screen without picking a student. */
  onBack?: () => void;
};

type PlaybackStatus = 'loading' | 'ready' | 'blocked' | 'error';
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${encodeURI(path)}`;

/**
 * Crops the standing front frame out of a character sheet: multi-row walk
 * sheets idle on the middle column of the first row, 1x4 pose strips put
 * the front pose first. The img keeps the sheet's full scaled size and the
 * clipped container picks out the single frame.
 */
export function AvatarFace({ textureKey, size = 52 }: { textureKey: TextureKey; size?: number }) {
  const sheet = SPRITESHEET_ASSETS.find((s) => s.key === textureKey);
  if (!sheet) return null;
  const height = size;
  const frameW = (sheet.frameWidth / sheet.frameHeight) * height;
  const col = sheet.rows > 1 ? 1 : 0;
  return (
    <span className="avatar-face" style={{ width: frameW, height }} aria-hidden="true">
      <img
        src={assetUrl(sheet.path)}
        alt=""
        style={{
          width: frameW * sheet.columns,
          height: height * sheet.rows,
          transform: col ? `translateX(${-col * frameW}px)` : undefined,
        }}
        draggable={false}
      />
    </span>
  );
}

export default function IntroSequence({ stage, onContinue, onStudent, savedName, onResume, onBack }: IntroSequenceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const finishedRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(true);
  const [status, setStatus] = useState<PlaybackStatus>('loading');

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video || finishedRef.current) return;
    setStatus('loading');
    void video.play().catch((error: unknown) => {
      if (videoRef.current !== video || finishedRef.current) return;
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setStatus(error instanceof DOMException && error.name === 'NotAllowedError' ? 'blocked' : 'error');
    });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    return () => video?.pause();
  }, []);

  useEffect(() => {
    if (stage === 'lina') {
      videoRef.current?.pause();
      continueRef.current?.focus({ preventScroll: true });
    }
  }, [stage]);

  // A roster pick lands here directly - the click's user activation is still
  // fresh enough to start the cinematic; the blocked fallback covers the rest.
  useEffect(() => {
    if (stage === 'opening') play();
  }, [stage, play]);

  const finishOpening = () => {
    if (stage !== 'opening' || finishedRef.current) return;
    finishedRef.current = true;
    videoRef.current?.pause();
    onContinue();
  };

  const retry = () => {
    if (status === 'error') videoRef.current?.load();
    play();
  };

  return (
    <main className={`startup-screen cinematic-intro cinematic-${stage}`} aria-label="Denge Kasabası açılışı">
      <div className="cinematic-backdrop" aria-hidden="true">
        <img className="cinematic-media" src={assetUrl(INTRO_ART.clouds)} alt="" />
        <video
          ref={videoRef}
          className="cinematic-media"
          src={assetUrl(INTRO_VIDEOS.opening.path)}
          poster={assetUrl(INTRO_ART.clouds)}
          playsInline
          muted={muted}
          preload="auto"
          onEnded={finishOpening}
          onPlaying={() => { setStatus('ready'); setPaused(false); }}
          onPause={() => setPaused(true)}
          onCanPlay={() => setStatus((previous) => previous === 'loading' ? 'ready' : previous)}
          onWaiting={() => setStatus((previous) => previous === 'ready' ? 'loading' : previous)}
          onError={() => setStatus('error')}
          onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
        />
        <img className="cinematic-media town-hold" src={assetUrl(INTRO_ART.town)} alt="" />
      </div>

      <div className="cinematic-toolbar">
        {stage === 'opening' && status === 'ready' && (
          <button className="startup-button startup-button-glass" onClick={() => paused ? play() : videoRef.current?.pause()}>
            {paused ? 'Devam et' : 'Duraklat'}
          </button>
        )}
        <button className="startup-button startup-button-glass" aria-pressed={muted} onClick={() => setMuted(!muted)}>
          {muted ? 'Sesi aç' : 'Sesi kapat'}
        </button>
      </div>

      <section className={`cinematic-title ${stage !== 'splash' ? 'is-hidden' : ''}`} inert={stage !== 'splash'} aria-hidden={stage !== 'splash'}>
        <p className="startup-eyebrow">BİRLİKTE YAŞA, DENGEYİ BUL</p>
        <h1>Denge<br /><span>Kasabası</span></h1>
        <p className="splash-description">Bir kasaba. Birlikte keşfedeceğimiz bir hikâye.</p>
        <button
          className="startup-button startup-button-primary"
          onClick={onContinue}
        >
          Başla
        </button>
        {savedName && onResume && (
          <button className="startup-button startup-button-glass" onClick={onResume}>
            ▶ Devam et — {savedName}
          </button>
        )}
      </section>

      {stage === 'profile' && (
        <section className="profile-panel" aria-label="Öğrenci girişi">
          {onBack && (
            <button className="profile-back startup-button startup-button-glass" onClick={onBack}>
              ← Ana sayfa
            </button>
          )}
          <StudentGate onPick={onStudent} />
        </section>
      )}

      {stage === 'opening' && (
        <>
          {status === 'loading' && <p className="intro-loading" role="status">Kasaba hazırlanıyor…</p>}
          {(status === 'blocked' || status === 'error') && (
            <div className="intro-fallback">
              <p role="status">
                {status === 'blocked'
                  ? 'Kasabaya yaklaşmak için oynat düğmesine dokun.'
                  : 'Video oynatılamadı. Yeniden deneyebilir veya doğrudan Lina’ya geçebilirsin.'}
              </p>
              <button className="startup-button startup-button-primary" onClick={retry}>
                {status === 'blocked' ? 'Videoyu oynat' : 'Yeniden dene'}
              </button>
            </div>
          )}
          <footer className="cinematic-footer">
            <p>Kasabaya yaklaşıyoruz…</p>
            <button className="startup-button startup-button-glass" onClick={finishOpening}>Videoyu geç</button>
          </footer>
        </>
      )}

      {stage === 'lina' && (
        <section className="lina-foreground" aria-label="Lina ile tanış">
          <MaskedVideo src={assetUrl(INTRO_VIDEOS.lina.path)} poster={assetUrl(INTRO_ART.lina)} muted={muted} />
          <footer className="cinematic-footer">
            <p>Lina · Rehberin</p>
            <button ref={continueRef} className="startup-button startup-button-primary" onClick={onContinue}>Kasabaya geç</button>
          </footer>
        </section>
      )}
    </main>
  );
}
