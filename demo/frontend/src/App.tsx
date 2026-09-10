import { useSession } from './context/sessionContext.ts'
import { IntroScreen } from './screens/IntroScreen.tsx'
import { TownMapScreen } from './screens/TownMapScreen.tsx'
import { ResearchScreen } from './screens/ResearchScreen.tsx'
import { PlanningScreen } from './screens/PlanningScreen.tsx'
import { DecisionScreen } from './screens/DecisionScreen.tsx'
import { OutcomeScreen } from './screens/OutcomeScreen.tsx'
import { ReflectionScreen } from './screens/ReflectionScreen.tsx'
import { SessionSummaryScreen } from './screens/SessionSummaryScreen.tsx'

function App() {
  const { state, storageAvailable, apiSyncFailed } = useSession()

  return (
    <>
      {state.currentScreen === 1 && <IntroScreen />}
      {state.currentScreen === 2 && <TownMapScreen />}
      {state.currentScreen === 3 && <ResearchScreen />}
      {state.currentScreen === 4 && <PlanningScreen />}
      {state.currentScreen === 5 && <DecisionScreen />}
      {state.currentScreen === 6 && <OutcomeScreen />}
      {state.currentScreen === 7 && <ReflectionScreen />}
      {state.currentScreen === 8 && <SessionSummaryScreen />}
      {!storageAvailable && (
        <p className="storage-warning" role="status">
          Bu tarayıcıda oturum kaydedilemiyor. Sayfayı yenilersen ilerleme kaybolabilir.
        </p>
      )}
      {apiSyncFailed && (
        <p className="storage-warning" role="status">
          Sunucu bağlantısı kurulamadı. Oturum bu cihazda devam ediyor.
        </p>
      )}
    </>
  )
}

export default App
