import { AreaInfoModal } from '../components/AreaInfoModal.tsx'
import { areas } from '../data/areas.ts'
import { CharacterDialogue } from '../components/CharacterDialogue.tsx'
import { firstTask, linaFirstTask, linaExplorationComplete } from '../data/characterDialogues.ts'
import { useEffect, useRef, useState } from 'react'
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
  const [selectedArea, setSelectedArea] = useState<LocationId | null>(null)
  const visitedAreas = state.exploredLocations
  const allVisited = waterCrisisScenario.locations.every(({ id }) => visitedAreas.includes(id))

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
                  className={`location-pin ${detail.className}${selectedArea === location.id ? ' active' : ''}`}
                  type="button"
                  key={location.id}
                  aria-label={`${location.name}: ${detail.subtitle}${explored ? ', incelendi' : ''}`}
                  aria-haspopup="dialog"
                  onClick={() => setSelectedArea(location.id)}
                >
                  <span className="pin-icon"><LocationIcon locationId={location.id} /></span>
                  <span className="pin-copy"><strong>{location.name}{explored && <span className="pin-completed" aria-hidden="true"> ✓</span>}</strong><small>{detail.subtitle}</small></span>
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
            <h1 id="town-map-title" ref={heading} tabIndex={-1}>{firstTask.title}</h1>
            <CharacterDialogue dialogue={allVisited ? linaExplorationComplete : linaFirstTask} />
            <p className="task-lead">{firstTask.instruction} {firstTask.hint}</p>
            <div className="exploration-progress">
              <div><strong>{firstTask.progressLabel}</strong><span role="status" aria-label="Görev ilerlemesi">{visitedAreas.length}/{waterCrisisScenario.locations.length} Bölge İncelendi</span></div>
              <progress aria-label="İncelenen bölgeler" max={waterCrisisScenario.locations.length} value={visitedAreas.length} />
            </div>
          </div>
          <div>
            <PrimaryButton onClick={continueToResearch} disabled={!allVisited} aria-describedby={!allVisited ? 'exploration-required' : undefined}>{firstTask.continueLabel}</PrimaryButton>
            {!allVisited && <p className="decision-requirement" id="exploration-required">{firstTask.lockedMessage}</p>}
          </div>
        </aside>
      </main>
      {selectedArea && <AreaInfoModal key={selectedArea} area={areas[selectedArea]}
        onClose={() => setSelectedArea(null)}
        onComplete={() => {
          // Keep the existing persisted session/event format; record only explicit completion.
          if (!visitedAreas.includes(selectedArea)) openLocation(selectedArea)
          setSelectedArea(null)
        }} /> }
    </>
  )
}
