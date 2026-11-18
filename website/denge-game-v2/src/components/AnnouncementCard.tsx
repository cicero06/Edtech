import { useState } from 'react';

import {
  ANNOUNCE_HEADLINES,
  ANNOUNCE_MESSAGE_MAX,
} from '../Game/data/story';
import { loadSession, type PlayerProfile } from '../Game/data/session';
import { activeFacts } from '../Game/scenario';

type AnnouncementCardProps = {
  player: PlayerProfile | null;
  onSubmit: (icon: string, headline: string, message: string) => void;
};

type SocialStep = 1 | 2 | 3 | 4 | 5;

interface PhotoOption {
  id: string;
  title: string;
  icon: string;
  src: string;
  locationIdx: number;
}

interface FilterOption {
  name: string;
  cssFilter: string;
}

interface FeedPost {
  id: string;
  authorName: string;
  authorHandle: string;
  avatarEmoji: string;
  timeAgo: string;
  location: string;
  caption: string;
  photoSrc: string;
  filterCss: string;
  tags: string[];
  likes: number;
  isLiked: boolean;
  comments: number;
  damProgressPct?: number;
}

const baseUrl = import.meta.env.BASE_URL;

const PHOTO_ALBUM: readonly PhotoOption[] = [
  {
    id: 'reservoir',
    title: 'Dağ Barajı & Rezervuar',
    icon: '💧',
    src: `${baseUrl}assets/maps/reservoir-panorama.webp`,
    locationIdx: 1,
  },
  {
    id: 'farm',
    title: 'Bereket Vadisi & Damla Sulama',
    icon: '🌾',
    src: `${baseUrl}assets/workshops/riza-farm.webp`,
    locationIdx: 4,
  },
  {
    id: 'park',
    title: 'Merkez Parkı & Kameriye',
    icon: '🌳',
    src: `${baseUrl}assets/workshops/kemal-park.webp`,
    locationIdx: 3,
  },
  {
    id: 'street',
    title: 'Çınar Caddesi & Boru Onarımı',
    icon: '🔧',
    src: `${baseUrl}assets/workshops/nuri-street.webp`,
    locationIdx: 2,
  },
  {
    id: 'cistern',
    title: 'Yağmur Suyu Sarnıcı',
    icon: '🌧️',
    src: `${baseUrl}assets/workshops/nuri-cistern.webp`,
    locationIdx: 2,
  },
  {
    id: 'kadim',
    title: 'Kadim Su Uyum Haritası',
    icon: '🪨',
    src: `${baseUrl}assets/workshops/kadim-map.webp`,
    locationIdx: 0,
  },
  {
    id: 'pipe-clean',
    title: 'Yenilenen Temiz Su Hattı',
    icon: '🚰',
    src: `${baseUrl}assets/workshops/nuri-pipe-repaired.webp`,
    locationIdx: 2,
  },
  {
    id: 'badge',
    title: 'Bereket Hasat Arması',
    icon: '🏅',
    src: `${baseUrl}assets/workshops/riza-badge.webp`,
    locationIdx: 4,
  },
  {
    id: 'dam-front',
    title: 'Baraj Kapakları & Savak',
    icon: '🏞️',
    src: `${baseUrl}assets/water/dam-front.webp`,
    locationIdx: 1,
  },
  {
    id: 'plaza',
    title: 'Belediye Meydanı',
    icon: '🏛️',
    src: `${baseUrl}assets/ground/cobble-plaza.webp`,
    locationIdx: 0,
  },
  {
    id: 'gazebo',
    title: 'Park Dinlenme Alanı',
    icon: '🌿',
    src: `${baseUrl}assets/props/gazebo.webp`,
    locationIdx: 3,
  },
  {
    id: 'town-overview',
    title: 'Denge Kasabası Genel Görünüm',
    icon: '🏘️',
    src: `${baseUrl}assets/videos/intro-town.jpg`,
    locationIdx: 0,
  },
];

const FILTERS: readonly FilterOption[] = [
  { name: 'Orijinal', cssFilter: 'none' },
  { name: 'Canlı', cssFilter: 'saturate(1.35) contrast(1.06) brightness(1.04)' },
  { name: 'Sıcak', cssFilter: 'sepia(0.24) saturate(1.25) brightness(1.03)' },
  { name: 'Masalsı', cssFilter: 'hue-rotate(-12deg) saturate(1.2) brightness(1.06)' },
  { name: 'Neşeli', cssFilter: 'hue-rotate(10deg) saturate(1.3) contrast(1.05)' },
];

const LOCATIONS = [
  'Merkez Meydanı',
  'Dağ Barajı',
  'Çınar Caddesi',
  'Merkez Parkı',
  'Bereket Vadisi',
] as const;

const HASHTAGS = [
  '#SuTasarrufu',
  '#DengeKasabası',
  '#DahaYeşil',
  '#GeleceğeYatırım',
] as const;

const TOPICS = [
  '💧 Su Tasarrufu',
  '🌱 Çevre',
  '🔧 Altyapı Onarımı',
  '🌾 Modern Tarım',
] as const;

const AUDIENCES = [
  { id: 'all', icon: '🌐', title: 'Herkes', sub: 'Tüm kasaba' },
  { id: 'friends', icon: '👥', title: 'Arkadaşlar', sub: 'Kasaba dostları' },
  { id: 'class', icon: '🎓', title: 'Sınıf', sub: 'Sınıf arkadaşların' },
] as const;

export default function AnnouncementCard({ player, onSubmit }: AnnouncementCardProps) {
  const f = activeFacts();
  const session = loadSession();
  const pickedSolutions = session?.plan?.solutionIds ?? [];

  const [step, setStep] = useState<SocialStep>(1);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [selectedFilterIdx, setSelectedFilterIdx] = useState(0);
  const [activeToolTab, setActiveToolTab] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [zoomCrop, setZoomCrop] = useState(false);

  // Accurate headline selection (pedagogical requirement preserved!)
  const defaultHeadlineId = ANNOUNCE_HEADLINES.find((h) => h.accurate)?.id ?? null;
  const [headlineId, setHeadlineId] = useState<string | null>(defaultHeadlineId);
  const [wrongHeadlineId, setWrongHeadlineId] = useState<string | null>(null);

  const [caption, setCaption] = useState(() => {
    if (pickedSolutions.includes('repair-pipes') && pickedSolutions.includes('drip-irrigation')) {
      return `Kasabamızdaki ${f.leakL} L/dk boru kaçağını onarıyor ve tarlalarda damla sulamaya geçiyoruz! 💧🌾 Suyumuzu kanıtlarla koruyoruz.`;
    }
    if (pickedSolutions.includes('repair-pipes')) {
      return `Çınar Caddesi'ndeki ${f.leakL} L/dk şebeke kaçağını onarıyoruz! 🔧💧 Artık temiz suyumuz toprağa karışmayacak.`;
    }
    return `Barajımızdaki %${f.reservoirPct} su rezervini korumak için kasaba meclisinde yeni eylem planımızı başlattık! 💧🌱`;
  });

  const [locationIdx, setLocationIdx] = useState(0);
  const [activeTags, setActiveTags] = useState<boolean[]>([true, true, true, false]);
  const [activeTopics, setActiveTopics] = useState<boolean[]>([true, false, true, false]);
  const [audienceIdx, setAudienceIdx] = useState(0);

  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(() => [
    {
      id: 'post-official',
      authorName: 'Denge Kasabası',
      authorHandle: '@denge_resmi',
      avatarEmoji: '🏛️',
      timeAgo: '1 saat önce',
      location: 'Dağ Barajı',
      caption: `Kasaba barajımızın güncel doluluk oranı %${f.reservoirPct} olarak ölçüldü. Şebekeden dakikada ${f.outflowL} L su çıkıyor. Hep birlikte suyumuzu koruyalım! 🌊💚`,
      photoSrc: PHOTO_ALBUM[0].src,
      filterCss: 'none',
      tags: ['#SuTasarrufu', '#DengeKasabası', '#BarajDurumu'],
      likes: 56,
      isLiked: false,
      comments: 12,
      damProgressPct: f.reservoirPct,
    },
    {
      id: 'post-zeynep',
      authorName: 'Zeynep',
      authorHandle: '@zeynep_kasaba',
      avatarEmoji: '👧',
      timeAgo: '2 saat önce',
      location: 'Çınar Caddesi',
      caption: `Mahallemizde dakikada ${f.leakL} L suyun boşa aktığı sızıntı tespit edildi! Belediye meclisinden çıkacak kararı heyecanla bekliyoruz. 🔧💧`,
      photoSrc: PHOTO_ALBUM[3].src,
      filterCss: 'none',
      tags: ['💧 Temiz Su', '🔧 Altyapı', '👥 Güçlü Kasaba'],
      likes: 34,
      isLiked: false,
      comments: 6,
    },
    {
      id: 'post-mert',
      authorName: 'Mert',
      authorHandle: '@mert_kasaba',
      avatarEmoji: '👦',
      timeAgo: '4 saat önce',
      location: 'Bereket Vadisi',
      caption: `Çiftçi Rıza Amca ile tarlada damla sulama denemesi yaptık! 🌾 Açık kanaldaki ${f.farmL} L/dk tüketimi düşürmek elimizde.`,
      photoSrc: PHOTO_ALBUM[1].src,
      filterCss: FILTERS[1].cssFilter,
      tags: ['#SuTasarrufu', '#ModernTarım', '#GeleceğeYatırım'],
      likes: 29,
      isLiked: false,
      comments: 4,
    },
  ]);

  const photo = PHOTO_ALBUM[selectedPhotoIdx] ?? PHOTO_ALBUM[0];
  const filter = FILTERS[selectedFilterIdx] ?? FILTERS[0];
  const headline = ANNOUNCE_HEADLINES.find((h) => h.id === headlineId) ?? null;

  const combinedFilterCss = `${filter.cssFilter === 'none' ? '' : filter.cssFilter} brightness(${brightness}%)`.trim();
  const chosenTags = HASHTAGS.filter((_, idx) => activeTags[idx]);
  const ready = headline?.accurate === true && caption.trim().length >= 10;

  const pickHeadline = (id: string) => {
    const picked = ANNOUNCE_HEADLINES.find((h) => h.id === id);
    if (picked && !picked.accurate) {
      setWrongHeadlineId(id);
      setHeadlineId(null);
      return;
    }
    setWrongHeadlineId(null);
    setHeadlineId(id);
  };

  const toggleLike = (id: string) => {
    setFeedPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p,
      ),
    );
  };

  const handlePublish = () => {
    const validHeadline =
      headline?.accurate
        ? headline.text
        : ANNOUNCE_HEADLINES.find((h) => h.accurate)?.text ?? 'Belediye su krizi için ilk önlemleri başlattı';
    const finalMessage = caption.trim().slice(0, ANNOUNCE_MESSAGE_MAX);
    onSubmit(photo.icon, validHeadline, finalMessage);
  };

  const studentName = player?.name ?? 'Kasaba Elçisi';
  const studentHandle = `@${studentName.toLowerCase().replace(/\s+/g, '_')}`;

  return (
    <div
      className="investigation-overlay social-phone-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Denge Kasabası Sosyal Medya Paylaşımı"
    >
      <div className="social-phone-bezel">
        {/* Top Smartphone Status Bar */}
        <div className="social-status-bar" aria-hidden="true">
          <span className="social-status-time">9:41</span>
          <div className="social-dynamic-island" />
          <span className="social-status-icons">📶 🛜 🔋</span>
        </div>

        {/* App Header Bar */}
        <header className="social-app-topbar">
          {step > 1 ? (
            <button
              type="button"
              className="social-nav-back"
              onClick={() => setStep((s) => Math.max(1, s - 1) as SocialStep)}
            >
              ‹ Geri
            </button>
          ) : (
            <div className="social-brand-box">
              <strong>🏰 Dengegram</strong>
              <span>KASABA SOSYAL AKIŞI</span>
            </div>
          )}

          {step > 1 && (
            <div className="social-step-center-title">
              {step === 2 && 'Yeni Gönderi · Galeri'}
              {step === 3 && 'Fotoğrafı Düzenle'}
              {step === 4 && 'Başlık & Gönderi Bilgileri'}
              {step === 5 && 'Önizle ve Yayınla'}
            </div>
          )}

          {step === 1 ? (
            <button
              type="button"
              className="social-newpost-cta"
              onClick={() => setStep(2)}
            >
              + Yeni Gönderi
            </button>
          ) : step < 5 ? (
            <button
              type="button"
              className="social-next-btn"
              disabled={step === 4 && !ready}
              onClick={() => setStep((s) => Math.min(5, s + 1) as SocialStep)}
            >
              İleri ›
            </button>
          ) : (
            <button
              type="button"
              className="social-next-btn"
              disabled={!ready}
              onClick={handlePublish}
            >
              Paylaş ✓
            </button>
          )}
        </header>

        {/* Step Indicator Banner */}
        <div className="social-step-banner">
          <span className="social-step-pill">{step}/5</span>
          <div className="social-step-banner-text">
            <strong>
              {step === 1 && 'Adım 1: Kasaba Akışı & Gönderi Başlat'}
              {step === 2 && 'Adım 2: Kasaba Albümünden Görsel Seç'}
              {step === 3 && 'Adım 3: Filtre ve Kadraj Düzenleme'}
              {step === 4 && 'Adım 4: Doğru Başlık, Açıklama ve Etiketler'}
              {step === 5 && 'Adım 5: Instagram Kart Önizlemesi & Yayınla'}
            </strong>
            <span>
              {step === 1 && 'Kasabalıların paylaşımlarını incele ve "+ Yeni Gönderi" ile duyurunu hazırla!'}
              {step === 2 && 'Alınan meclis kararını en iyi anlatan kasaba fotoğrafını seç.'}
              {step === 3 && 'Fotoğrafına filtre uygula ve en güzel haliyle paylaşmaya hazırla!'}
              {step === 4 && 'Abartısız, kanıta dayalı bir başlık seç ve açıklamanı tamamla.'}
              {step === 5 && 'Gönderini kontrol et; her şey hazırsa tüm kasabayla paylaş!'}
            </span>
          </div>
          <span className="social-mascot-drop" aria-hidden="true">💧✨</span>
        </div>

        {/* Main Scrollable Screen Body */}
        <div className="social-screen-body">
          {/* ==================== ADIM 1: FEED ==================== */}
          {step === 1 && (
            <div className="social-feed-list">
              {feedPosts.map((post) => (
                <article key={post.id} className="insta-post-card">
                  <div className="insta-post-header">
                    <span className="insta-avatar">{post.avatarEmoji}</span>
                    <div className="insta-author-meta">
                      <strong>{post.authorName}</strong>
                      <span>
                        {post.authorHandle} • {post.timeAgo} • 📍 {post.location}
                      </span>
                    </div>
                  </div>

                  <div className="insta-photo-frame">
                    <img
                      src={post.photoSrc}
                      alt={post.authorName}
                      style={{ filter: post.filterCss }}
                    />
                    {typeof post.damProgressPct === 'number' && (
                      <div className="insta-dam-overlay">
                        <div
                          className="insta-dam-fill"
                          style={{ width: `${Math.min(100, Math.max(5, post.damProgressPct))}%` }}
                        />
                        <span>GÜNCEL BARAJ DOLULUK: %{post.damProgressPct}</span>
                      </div>
                    )}
                  </div>

                  <div className="insta-action-bar">
                    <button
                      type="button"
                      className={`insta-like-btn${post.isLiked ? ' liked' : ''}`}
                      onClick={() => toggleLike(post.id)}
                    >
                      {post.isLiked ? '❤️' : '🤍'} {post.likes} Beğeni
                    </button>
                    <span className="insta-comment-count">💬 {post.comments} Yorum</span>
                    <span className="insta-save-tag">🔖 Kaydet</span>
                  </div>

                  <p className="insta-caption">
                    <strong>{post.authorHandle}</strong> {post.caption}
                  </p>

                  <div className="insta-tags-row">
                    {post.tags.map((t) => (
                      <span key={t} className="insta-tag-chip">
                        {t}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* ==================== ADIM 2: GÖRSEL SEÇİMİ ==================== */}
          {step === 2 && (
            <div className="social-step2-gallery">
              <div className="social-big-preview">
                <img src={photo.src} alt={photo.title} />
                <span className="social-selected-overlay-title">
                  {photo.icon} {photo.title}
                </span>
                <span className="social-selected-badge">✓ Seçildi</span>
              </div>

              <div className="social-photo-grid" role="radiogroup" aria-label="Kasaba Albümü">
                {PHOTO_ALBUM.map((item, idx) => {
                  const isSel = idx === selectedPhotoIdx;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`social-grid-thumb${isSel ? ' selected' : ''}`}
                      aria-pressed={isSel}
                      onClick={() => {
                        setSelectedPhotoIdx(idx);
                        setLocationIdx(item.locationIdx);
                      }}
                    >
                      <img src={item.src} alt={item.title} loading="lazy" />
                      <span className="social-thumb-caption">
                        {item.icon} {item.title}
                      </span>
                      {isSel && <span className="social-thumb-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== ADIM 3: FİLTRE & DÜZENLE ==================== */}
          {step === 3 && (
            <div className="social-step3-edit">
              <div className={`social-edit-stage${zoomCrop ? ' cropped' : ''}`}>
                <img
                  src={photo.src}
                  alt={photo.title}
                  style={{ filter: combinedFilterCss }}
                />
                {/* Rule of Thirds Grid Overlay */}
                <div className="social-thirds-grid" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <span className="social-filter-pill">
                  🎨 {filter.name} · ☀️ %{brightness}
                </span>
              </div>

              <div className="social-edit-tabs">
                {['🎨 Filtreler', '✂️ Kadraj', '☀️ Parlaklık', '🏷️ Konum'].map((tab, idx) => (
                  <button
                    key={tab}
                    type="button"
                    className={`social-tool-tab${activeToolTab === idx ? ' active' : ''}`}
                    onClick={() => setActiveToolTab(idx)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeToolTab === 0 && (
                <div className="social-filter-strip">
                  {FILTERS.map((fItem, idx) => (
                    <button
                      key={fItem.name}
                      type="button"
                      className={`social-filter-card${selectedFilterIdx === idx ? ' selected' : ''}`}
                      onClick={() => setSelectedFilterIdx(idx)}
                    >
                      <img
                        src={photo.src}
                        alt={fItem.name}
                        style={{ filter: fItem.cssFilter }}
                      />
                      <span>{fItem.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeToolTab === 1 && (
                <div className="social-subtool-box">
                  <button
                    type="button"
                    className={`rationale-chip${!zoomCrop ? ' picked' : ''}`}
                    onClick={() => setZoomCrop(false)}
                  >
                    🖼️ Standart Geniş Kadraj (16:10)
                  </button>
                  <button
                    type="button"
                    className={`rationale-chip${zoomCrop ? ' picked' : ''}`}
                    onClick={() => setZoomCrop(true)}
                  >
                    🔍 Yakınlaştırılmış Odak Kadrajı
                  </button>
                </div>
              )}

              {activeToolTab === 2 && (
                <div className="social-subtool-box">
                  <label className="social-slider-label">
                    <span>Işık & Parlaklık: %{brightness}</span>
                    <input
                      type="range"
                      min={80}
                      max={125}
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                    />
                  </label>
                </div>
              )}

              {activeToolTab === 3 && (
                <div className="social-chip-group">
                  {LOCATIONS.map((loc, idx) => (
                    <button
                      key={loc}
                      type="button"
                      className={`social-select-chip${locationIdx === idx ? ' active' : ''}`}
                      onClick={() => setLocationIdx(idx)}
                    >
                      📍 {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== ADIM 4: DETAYLAR & BAŞLIK ==================== */}
          {step === 4 && (
            <div className="social-step4-details">
              {/* Accurate Headline Check */}
              <div className="social-detail-card">
                <p className="social-detail-title">
                  1 · Haberin Manşetini Seç <em>(Doğru ve kanıta dayalı olmalı)</em>
                </p>
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

              {/* Caption Box with Thumbnail */}
              <div className="social-detail-card">
                <p className="social-detail-title">
                  2 · Gönderi Açıklaması{' '}
                  <em>
                    ({caption.trim().length}/{ANNOUNCE_MESSAGE_MAX})
                  </em>
                </p>
                <div className="social-caption-row">
                  <img
                    src={photo.src}
                    alt={photo.title}
                    className="social-caption-thumb"
                    style={{ filter: combinedFilterCss }}
                  />
                  <textarea
                    className="social-caption-textarea"
                    maxLength={ANNOUNCE_MESSAGE_MAX}
                    rows={3}
                    placeholder="Kasaba halkına hangi önlemleri aldığımızı ve nedenini yaz…"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>
                <div className="social-template-row">
                  <button
                    type="button"
                    className="social-tpl-btn"
                    onClick={() =>
                      setCaption(
                        `Barajımızdaki %${f.reservoirPct} rezervi korumak için ${f.leakL} L/dk boru kaçağını onarıyor ve suyu tasarruflu kullanıyoruz! 💧🌱`,
                      )
                    }
                  >
                    💧 Su & Kaçak Şablonu
                  </button>
                  <button
                    type="button"
                    className="social-tpl-btn"
                    onClick={() =>
                      setCaption(
                        `Bereket Vadisi'nde damla sulama ve mahallemizde şebeke bakımıyla geleceğimizi güvenceye alıyoruz! 🌾🔧`,
                      )
                    }
                  >
                    🌾 Tarım & Denge Şablonu
                  </button>
                </div>
              </div>

              {/* Location & Hashtags */}
              <div className="social-detail-card">
                <p className="social-detail-title">3 · 📍 Konum ve #️⃣ Etiketler</p>
                <div className="social-chip-group">
                  {LOCATIONS.map((loc, idx) => (
                    <button
                      key={loc}
                      type="button"
                      className={`social-select-chip${locationIdx === idx ? ' active' : ''}`}
                      onClick={() => setLocationIdx(idx)}
                    >
                      📍 {loc}
                    </button>
                  ))}
                </div>
                <div className="social-chip-group" style={{ marginTop: 6 }}>
                  {HASHTAGS.map((tag, idx) => (
                    <button
                      key={tag}
                      type="button"
                      className={`social-tag-toggle${activeTags[idx] ? ' active' : ''}`}
                      onClick={() =>
                        setActiveTags((prev) => prev.map((v, i) => (i === idx ? !v : v)))
                      }
                    >
                      {tag} {activeTags[idx] ? '✓' : '+'}
                    </button>
                  ))}
                </div>
                <div className="social-chip-group" style={{ marginTop: 6 }}>
                  {TOPICS.map((topic, idx) => (
                    <button
                      key={topic}
                      type="button"
                      className={`social-select-chip${activeTopics[idx] ? ' active' : ''}`}
                      onClick={() =>
                        setActiveTopics((prev) => prev.map((v, i) => (i === idx ? !v : v)))
                      }
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audience */}
              <div className="social-detail-card">
                <p className="social-detail-title">4 · 👥 Kimler Görebilir?</p>
                <div className="social-audience-grid">
                  {AUDIENCES.map((aud, idx) => (
                    <button
                      key={aud.id}
                      type="button"
                      className={`social-audience-card${audienceIdx === idx ? ' active' : ''}`}
                      onClick={() => setAudienceIdx(idx)}
                    >
                      <span>{aud.icon}</span>
                      <strong>{aud.title}</strong>
                      <small>{aud.sub}</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== ADIM 5: ÖNİZLE VE YAYINLA ==================== */}
          {step === 5 && (
            <div className="social-step5-preview">
              <div className="social-preview-toprow">
                <strong>👁️ Instagram Kart Önizlemesi</strong>
                <button
                  type="button"
                  className="social-tpl-btn"
                  onClick={() => setStep(4)}
                >
                  ✏️ Bilgileri Düzenle
                </button>
              </div>

              <article className="insta-post-card preview-highlight">
                <div className="insta-post-header">
                  <span className="insta-avatar">{photo.icon}</span>
                  <div className="insta-author-meta">
                    <strong>{studentName} · Resmi Kasaba Duyurusu</strong>
                    <span>
                      {studentHandle} • Az önce • 📍 {LOCATIONS[locationIdx]} 🌍
                    </span>
                  </div>
                </div>

                <div className={`insta-photo-frame${zoomCrop ? ' cropped' : ''}`}>
                  <img
                    src={photo.src}
                    alt={photo.title}
                    style={{ filter: combinedFilterCss }}
                  />
                </div>

                <div className="insta-action-bar">
                  <span className="insta-like-btn liked">❤️ 42 Beğeni</span>
                  <span className="insta-comment-count">💬 8 Yorum</span>
                  <span className="insta-save-tag">🔖 Panoya Sabitlendi</span>
                </div>

                <p className="insta-headline-banner">
                  📢 {headline?.text ?? 'Belediye su krizi için ilk önlemleri başlattı'}
                </p>

                <p className="insta-caption">
                  <strong>{studentHandle}</strong> {caption}
                </p>

                <div className="insta-tags-row">
                  {chosenTags.map((t) => (
                    <span key={t} className="insta-tag-chip">
                      {t}
                    </span>
                  ))}
                </div>
              </article>

              {/* 4 Green Verification Chips from Unity Mockup 5 */}
              <div className="social-verify-grid">
                <div className="social-verify-chip">
                  <span className="verify-dot">✓</span>
                  <div>
                    <strong>🖼️ Görsel & Filtre</strong>
                    <small>{photo.title} ({filter.name})</small>
                  </div>
                </div>
                <div className="social-verify-chip">
                  <span className="verify-dot">✓</span>
                  <div>
                    <strong>📝 Doğrulanmış Başlık</strong>
                    <small>Kanıta dayalı metin hazır</small>
                  </div>
                </div>
                <div className="social-verify-chip">
                  <span className="verify-dot">✓</span>
                  <div>
                    <strong>🏷️ Etiketler & Konum</strong>
                    <small>
                      {chosenTags.length} etiket • {LOCATIONS[locationIdx]}
                    </small>
                  </div>
                </div>
                <div className="social-verify-chip">
                  <span className="verify-dot">✓</span>
                  <div>
                    <strong>🌐 Görünürlük</strong>
                    <small>{AUDIENCES[audienceIdx].title} ({AUDIENCES[audienceIdx].sub})</small>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="social-publish-giant-btn"
                disabled={!ready}
                onClick={handlePublish}
              >
                ✈️ Şimdi Kasaba Akışında Paylaş
              </button>
            </div>
          )}
        </div>

        {/* Bottom Smartphone Navigation Bar */}
        <nav className="social-bottom-nav" aria-label="Uygulama adımları">
          {[
            { s: 1 as SocialStep, icon: '🏠', label: 'Akış' },
            { s: 2 as SocialStep, icon: '📷', label: 'Albüm' },
            { s: 3 as SocialStep, icon: '🎨', label: 'Filtre' },
            { s: 4 as SocialStep, icon: '📝', label: 'Detay' },
            { s: 5 as SocialStep, icon: '✈️', label: 'Paylaş' },
          ].map((item) => (
            <button
              key={item.s}
              type="button"
              className={`social-bnav-item${step === item.s ? ' active' : ''}`}
              onClick={() => setStep(item.s)}
            >
              <span>{item.icon}</span>
              <small>{item.label}</small>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
