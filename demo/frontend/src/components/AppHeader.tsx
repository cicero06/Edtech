import { waterCrisisScenario } from '../data/waterCrisisScenario.ts'

export function AppHeader() {
  const { brand, subtitle } = waterCrisisScenario.intro

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
      <span className="task-progress">
        <span className="progress-dot" aria-hidden="true" />
        Görev 1 / 7
      </span>
    </header>
  )
}
