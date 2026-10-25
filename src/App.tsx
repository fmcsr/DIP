import { StatusBar } from 'expo-status-bar'
import { useCallback, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { CounterSurface } from './components/CounterSurface'
import { vibrateTap } from './lib/haptics'

export default function App() {
  const [count, setCount] = useState(0)

  const increment = useCallback(() => {
    setCount((current) => current + 1)
    vibrateTap()
  }, [])

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <CounterSurface count={count} onIncrement={increment} />
    </SafeAreaProvider>
  )
}
