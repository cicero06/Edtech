import { useCallback, useEffect, useRef, useState } from 'react';
import { INTRO_ART, INTRO_VIDEOS, type IntroStage } from '../Game/data/intro';
import { SPRITESHEET_ASSETS, type TextureKey } from '../Game/data/assets';
import { AVATARS, type PlayerProfile } from '../Game/data/session';
import MaskedVideo from './MaskedVideo';

type IntroSequenceProps = {
  stage: Exclude<IntroStage, 'complete'>;
  onContinue: () => void;
  /** Mock login: name + avatar picked on the profile screen. */
  onProfile: (player: PlayerProfile) => void;
  /** A previous session exists - resume straight into the game. */
  savedName?: string;
  onResume?: () => void;
};

type PlaybackStatus = 'loading' | 'ready' | 'blocked' | 'error';
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${encodeURI(path)}`;

/** Crops the front (down) frame out of a 1x4 character strip. */
function AvatarFace({ textureKey }: { textureKey: TextureKey }) {
  const sheet = SPRITESHEET_ASSETS.find((s) => s.key === textureKey);
  if (!sheet) return null;
  const height = 52;
  const frameW = (sheet.frameWidth / sheet.frameHeight) * height;
  const stripW = frameW * sheet.columns;
  return (
    <span className="avatar-face" style={{ width: frameW, height }} aria-hidden="true">
      <img src={assetUrl(sheet.path)} alt="" style={{ width: stripW, height }} draggable={false} />
    </span>
  );
}

export default function IntroSequence({ stage, onContinue, onProfile, savedName, onResume }: IntroSequenceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const finishedRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(true);
  const [status, setStatus] = useState<PlaybackStatus>('loading');
  const [playerName, setPlayerName] = useState('');
  const [avatar, setAvatar] = useState<TextureKey | null>(null);

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
        <section className="profile-panel" aria-label="Oyuncu profili">
          <p className="startup-eyebrow">ÖNCE TANIŞALIM</p>
          <h2 className="profile-title">Kimsin?</h2>
          <input
            className="profile-name-input"
            type="text"
            placeholder="Adını yaz"
            maxLength={16}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            autoFocus
          />
          <div className="avatar-grid" role="radiogroup" aria-label="Avatar seç">
            {AVATARS.map((key) => (
              <button
                key={key}
                className={`avatar-option${avatar === key ? ' picked' : ''}`}
                role="radio"
                aria-checked={avatar === key}
                onClick={() => setAvatar(key)}
              >
                <AvatarFace textureKey={key} />
              </button>
            ))}
          </div>
          <button
            className="startup-button startup-button-primary"
            disabled={!playerName.trim() || !avatar}
            onClick={() => {
              if (!avatar) return;
              onProfile({ name: playerName.trim(), avatar });
              onContinue();
              play();
            }}
          >
            Hazırım →
          </button>
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
