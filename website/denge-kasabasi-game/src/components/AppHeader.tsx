import { useSession } from '../context/sessionContext.ts'
import { waterCrisisScenario } from '../data/waterCrisisScenario.ts'

interface AppHeaderProps {
  step?: number
  showResources?: boolean
  water?: number
  budget?: number
}

export function AppHeader({
  step = 1,
  showResources = false,
  water = waterCrisisScenario.initialState.water,
  budget = waterCrisisScenario.initialState.budget,
}: AppHeaderProps) {
  const { brand, subtitle } = waterCrisisScenario.intro
  const { state, navigateBack, resetSession } = useSession()
  const canGoBack = state.currentScreen === 3 || state.currentScreen === 5 ||
    state.currentScreen === 7 || (state.currentScreen === 4 && state.revisionCount === 0)
  const startNewSession = () => {
    if (window.confirm('Mevcut anonim oturum sıfırlansın ve başa dönülsün mü?')) resetSession()
  }

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 4c-6-1-13 0-15 6-2 5 2 10 7 9 6-1 8-8 8-15Z" />
            <path d="M7 17c1-4 4-7 8-9" />
          </svg>
        </span>
        <div className="brand-copy">
          <span className="brand-name">{brand}</span>
          <span className="brand-subtitle">{subtitle}</span>
        </div>
      </div>
      {showResources && (
        <div className="resource-status" aria-label="Başlangıç kaynakları">
          <span className="resource-pill water-pill">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z" />
            </svg>
            Su: <strong>%{water}</strong>
          </span>
          <span className="resource-pill budget-pill">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M15 8.5c-.7-.5-1.6-.8-2.6-.8-1.5 0-2.7.8-2.7 2s1 1.8 2.8 2.3 2.8 1.1 2.8 2.3-1.2 2-2.8 2c-1.1 0-2.2-.4-3-1M12.5 6v12" />
            </svg>
            Bütçe: <strong>{budget}</strong>
          </span>
        </div>
      )}
      <div className="header-actions">
        {canGoBack && <button type="button" className="header-button" onClick={navigateBack}>← Önceki Adım</button>}
        {state.sessionId && <button type="button" className="header-button reset-button" onClick={startNewSession}>Yeni Oturum</button>}
        <span className="task-progress">
          <span className="progress-dot" aria-hidden="true" />
          Görev {step} / 7
        </span>
      </div>
    </header>
  )
}
