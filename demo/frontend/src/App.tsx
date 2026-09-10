import { useEffect, useRef } from 'react'
import { useSession } from './context/sessionContext.ts'
import { IntroScreen } from './screens/IntroScreen.tsx'

function App() {
  const { state, storageAvailable } = useSession()
  const placeholderHeading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (state.currentScreen === 2) placeholderHeading.current?.focus()
  }, [state.currentScreen])

  return (
    <>
      {state.currentScreen === 1 && <IntroScreen />}
      {state.currentScreen === 2 && (
        <main className="town-placeholder">
          <h1 ref={placeholderHeading} tabIndex={-1}>02 — Town Map</h1>
        </main>
      )}
      {!storageAvailable && (
        <p className="storage-warning" role="status">
          Bu tarayıcıda oturum kaydedilemiyor. Sayfayı yenilersen ilerleme kaybolabilir.
        </p>
      )}
    </>
  )
}

export default App
