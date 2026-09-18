import { useEffect, useRef } from 'react'
import { AppHeader } from '../components/AppHeader.tsx'
import { PrimaryButton } from '../components/PrimaryButton.tsx'
import { useSession } from '../context/sessionContext.ts'
import { waterCrisisScenario } from '../data/waterCrisisScenario.ts'
import type { LocationId } from '../types/scenario.ts'

const locationDetails: Record<LocationId, { subtitle: string; className: string }> = {
  dam: { subtitle: 'Su Rezervuarı', className: 'dam' },
  homes: { subtitle: 'Yerleşim Alanı', className: 'homes' },
  agriculture: { subtitle: 'Tarımsal Alanlar', className: 'agriculture' },
  park: { subtitle: 'Kent Parkı', className: 'park' },
  municipality: { subtitle: 'Belediye Binası', className: 'municipality' },
}

function LocationIcon({ locationId }: { locationId: LocationId }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {locationId === 'dam' && <><path d="M3 9h18M5 6h14M4 13c2-2 4 2 6 0s4 2 6 0 4 2 5 0M4 17c2-2 4 2 6 0s4 2 6 0 4 2 5 0" /></>}
      {locationId === 'homes' && <><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>}
      {locationId === 'agriculture' && <><path d="M5 10h14l-2 10H7L5 10Zm3-3h8M12 3v7M9 5l3 2 3-2" /></>}
      {locationId === 'park' && <><path d="m12 3-5 8h3l-4 6h12l-4-6h3l-5-8Zm0 14v4" /></>}
      {locationId === 'municipality' && <><path d="m3 9 9-5 9 5M4 10h16M6 10v8m4-8v8m4-8v8m4-8v8M3 20h18" /></>}
    </svg>
  )
}

export function TownMapScreen() {
  const { state, openLocation, continueToResearch } = useSession()
  const heading = useRef<HTMLHeadingElement>(null)
  const activeLocation = [...state.events].reverse().find((event) => event.eventType === 'location_opened')?.target

  useEffect(() => {
    heading.current?.focus()
  }, [])

  return (
    <>
      <AppHeader step={2} showResources />
      <main className="town-map-layout">
        <section className="map-card" aria-label="Denge Kasabası haritası">
          <div className="map-canvas">
            <img src={`${import.meta.env.BASE_URL}assets/town-intro.jpg`} alt="Barajı, evleri, tarım alanlarını, parkı ve belediye binasını gösteren Denge Kasabası haritası" width="512" height="512" />
            {waterCrisisScenario.locations.map((location) => {
              const detail = locationDetails[location.id]
              const explored = state.exploredLocations.includes(location.id)
              return (
                <button
                  className={`location-pin ${detail.className}${activeLocation === location.id ? ' active' : ''}`}
                  type="button"
                  key={location.id}
                  aria-label={`${location.name}: ${detail.subtitle}${explored ? ', incelendi' : ''}`}
                  aria-pressed={activeLocation === location.id}
                  onClick={() => openLocation(location.id)}
                >
                  <span className="pin-icon"><LocationIcon locationId={location.id} /></span>
                  <span className="pin-copy"><strong>{location.name}</strong><small>{detail.subtitle}</small></span>
                </button>
              )
            })}
            <span className="map-instruction">İncelemek istediğin bölgeye tıkla</span>
            <span className="map-label">Kasaba Haritası</span>
          </div>
        </section>
        <aside className="task-sidebar" aria-labelledby="town-map-title">
          <div>
            <span className="step-label">GÖREV ADIMI</span>
            <h1 id="town-map-title" ref={heading} tabIndex={-1}>GÖREV</h1>
            <p className="task-lead">Kasabanın neden su sorunu yaşadığını araştır.</p>
            <p className="task-info">Her bölgedeki su kullanımını ve durumu inceleyerek sorunun kaynağını bul.</p>
            <div className="checklist-heading">
              <h2>İNCELENEN BÖLGELER</h2>
              <span>{state.exploredLocations.length} / {waterCrisisScenario.locations.length} Seçildi</span>
            </div>
            <ul className="location-checklist">
              {waterCrisisScenario.locations.map((location) => {
                const explored = state.exploredLocations.includes(location.id)
                return (
                  <li key={location.id}>
                    <button type="button" className={explored ? 'explored' : ''} onClick={() => openLocation(location.id)}>
                      <span className="check-box" aria-hidden="true">{explored ? '✓' : ''}</span>
                      <span>{location.name}</span>
                      <small>{explored ? 'İncelendi' : 'Bekliyor'}</small>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
          <PrimaryButton onClick={continueToResearch}>BİLGİLERİ ARAŞTIR</PrimaryButton>
        </aside>
      </main>
    </>
  )
}
