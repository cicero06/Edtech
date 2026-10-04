import { useEffect, useRef } from "react";
import { Arrow } from "./Arrow";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  videoSrc?: string;
  posterSrc?: string;
}

export function VideoModal({
  isOpen,
  onClose,
  title = "Denge Kasabası — 3D Tanıtım Filmi",
  videoSrc = "/videos/denge-kasabasi-trailer-hd.mp4",
  posterSrc = "/images/trailer-poster.jpg",
}: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Auto-play when opened
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Autoplay policy might require interaction
      });
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="video-modal"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="video-modal__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="video-modal__header">
          <div className="video-modal__titles">
            <span className="video-modal__eyebrow">3D SİNEMATİK TANITIM · 1080P</span>
            <h2 className="video-modal__title">{title}</h2>
          </div>
          <button
            type="button"
            className="video-modal__close"
            onClick={onClose}
            aria-label="Videoyu kapat"
          >
            ×
          </button>
        </div>

        <div className="video-modal__player-wrap">
          <video
            ref={videoRef}
            src={videoSrc}
            poster={posterSrc}
            controls
            playsInline
            className="video-modal__player"
          >
            Tarayıcınız video oynatmayı desteklemiyor.
          </video>
        </div>

        <div className="video-modal__footer">
          <div className="video-modal__tags">
            <span className="vtag">1080p HD</span>
            <span className="vtag">Bölüm 1 &amp; Bölüm 2</span>
            <span className="vtag new">v2 Ön Gösterim</span>
          </div>
          <div className="video-modal__actions">
            <a
              className="button primary"
              href="/denge-kasabasi/ongosteri/"
              target="_blank"
              rel="noreferrer"
            >
              Ön Gösterimi Oyna <Arrow />
            </a>
            <button
              type="button"
              className="button light"
              onClick={onClose}
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
