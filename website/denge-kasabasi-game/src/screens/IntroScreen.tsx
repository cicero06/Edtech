import { AppHeader } from '../components/AppHeader.tsx'
import { PrimaryButton } from '../components/PrimaryButton.tsx'
import { useSession } from '../context/sessionContext.ts'
import { waterCrisisScenario } from '../data/waterCrisisScenario.ts'

export function IntroScreen() {
  const { startSession } = useSession()
  const { name, intro } = waterCrisisScenario

  return (
    <>
      <AppHeader />
      <main className="intro-layout">
        <section className="mission-card" aria-labelledby="scenario-title">
          <div>
            <div className="mission-identity" aria-label="Oyuncu karakteri">
              <div className="mission-avatar" aria-hidden="true">🧑‍🌾</div>
              <div className="mission-greeting">
                <strong>Kasaba Mühendisi</strong>
                <span>Arda</span>
              </div>
            </div>
            <span className="scenario-label">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3 10 10h3l-3 5h10l-3-5h3L15 3Zm0 12v5M4 14v6m-3 0h7" />
                <circle cx="4" cy="10" r="2" />
              </svg>
              {intro.brand}
            </span>
            <h1 id="scenario-title">{name.toLocaleUpperCase('tr-TR')}</h1>
            <p className="scenario-description">{intro.description}</p>
            <div className="mission-brief">
              <h2>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 21V3h8l1 3h6v10h-8l-1-3H5M5 6h6l1 3h8" />
                </svg>
                Görevin:
              </h2>
              <p>{intro.mission}</p>
            </div>
          </div>
          <div className="mission-action">
            <PrimaryButton onClick={startSession}>{intro.cta}</PrimaryButton>
            <p className="mission-footnote">{intro.footnote}</p>
          </div>
        </section>
        <div className="town-artwork">
          <img
            src={`${import.meta.env.BASE_URL}assets/town-intro.jpg`}
            alt="Denge Kasabası: baraj, evler, tarım alanları, park ve belediye binasının 2D görünümü"
            width="512"
            height="512"
            fetchPriority="high"
          />
          <span className="map-label">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16" />
            </svg>
            Kasaba Haritası
          </span>
        </div>
      </main>
    </>
  )
}
