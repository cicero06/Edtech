import { useState } from 'react';

import {
  ANNOUNCE_HEADLINES,
  ANNOUNCE_ICONS,
  ANNOUNCE_MESSAGE_HINT,
  ANNOUNCE_MESSAGE_MAX,
} from '../Game/data/story';
import type { PlayerProfile } from '../Game/data/session';

type AnnouncementCardProps = {
  player: PlayerProfile | null;
  onSubmit: (icon: string, headline: string, message: string) => void;
};

/**
 * Kasaba Panosu paylaşımı: oyuncu halka açıklamayı kendisi hazırlar.
 * Başlık şıklarından yalnızca *doğru* olanı geçer - abartılı ya da belirsiz
 * başlıklar geri bildirimle öğretir. Görsel serbest, mesaj 140 karakter.
 */
export default function AnnouncementCard({ player, onSubmit }: AnnouncementCardProps) {
  const [icon, setIcon] = useState<string | null>(null);
  const [headlineId, setHeadlineId] = useState<string | null>(null);
  const [wrongHeadlineId, setWrongHeadlineId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const headline = ANNOUNCE_HEADLINES.find((h) => h.id === headlineId) ?? null;
  const ready =
    icon !== null && headline?.accurate === true && message.trim().length >= 10;

  const pickHeadline = (id: string) => {
    const picked = ANNOUNCE_HEADLINES.find((h) => h.id === id);
    // Wrong headlines explain themselves; the player must re-pick.
    if (picked && !picked.accurate) {
      setWrongHeadlineId(id);
      setHeadlineId(null);
      return;
    }
    setWrongHeadlineId(null);
    setHeadlineId(id);
  };

  return (
    <div className="investigation-overlay" role="dialog" aria-label="Kasaba panosu paylaşımı">
      <div className="investigation-card announce-card">
        <header className="investigation-header">
          <h2>📢 KASABA PANOSU</h2>
          <p>Planı halka sen duyur - doğru ve anlaşılır bir paylaşım hazırla.</p>
        </header>

        <div className="announce-step">
          <p className="announce-label">1 · Paylaşım görseli seç</p>
          <div className="announce-icons" role="radiogroup" aria-label="Görsel">
            {ANNOUNCE_ICONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`announce-icon${icon === option ? ' selected' : ''}`}
                aria-pressed={icon === option}
                onClick={() => setIcon(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="announce-step">
          <p className="announce-label">2 · Başlık seç - dikkat: doğru bilgi vermeli</p>
          <div className="announce-headlines">
            {ANNOUNCE_HEADLINES.map((option) => (
              <div key={option.id}>
                <button
                  type="button"
                  className={`announce-headline${headlineId === option.id ? ' selected' : ''}${wrongHeadlineId === option.id ? ' wrong' : ''}`}
                  aria-pressed={headlineId === option.id}
                  onClick={() => pickHeadline(option.id)}
                >
                  {option.text}
                </button>
                {wrongHeadlineId === option.id && (
                  <p className="announce-feedback">{option.feedback}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="announce-step">
          <p className="announce-label">
            3 · Mesajını yaz{' '}
            <em className="announce-counter">
              {message.trim().length}/{ANNOUNCE_MESSAGE_MAX}
            </em>
          </p>
          <textarea
            className="announce-message"
            maxLength={ANNOUNCE_MESSAGE_MAX}
            rows={3}
            placeholder={ANNOUNCE_MESSAGE_HINT}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {/* Live preview - what the town will actually see */}
        <div className="announce-preview" aria-label="Paylaşım önizlemesi">
          <span className="announce-avatar">{icon ?? '❔'}</span>
          <div className="announce-body">
            <p className="announce-meta">
              <strong>@DengeKasabasi</strong> · Bugün · {player?.name ?? 'Muhabir'} hazırladı
            </p>
            <p className="announce-preview-headline">
              {headline?.accurate ? headline.text : '…başlık burada görünecek…'}
            </p>
            <p className="announce-preview-message">
              {message.trim() || '…mesajın burada görünecek…'}
            </p>
          </div>
        </div>

        <footer className="investigation-footer">
          <button
            className="startup-button investigation-cta"
            disabled={!ready}
            onClick={() => onSubmit(icon!, headline!.text, message.trim())}
          >
            PAYLAŞIMI YAYINLA →
          </button>
        </footer>
      </div>
    </div>
  );
}
