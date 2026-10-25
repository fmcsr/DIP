import { useCallback, useState } from 'react'
import { CounterSurface } from './components/CounterSurface.tsx'
import { vibrateTap } from './lib/haptics.ts'

function App() {
  const [count, setCount] = useState(0)

  const increment = useCallback(() => {
    setCount((current) => current + 1)
    vibrateTap()
  }, [])

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <h1 className="sr-only">Flow Count</h1>
      <CounterSurface count={count} onIncrement={increment} />
    </main>
  )
}

export default App
