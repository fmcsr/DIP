import { StatusBar } from 'expo-status-bar'
import { useCallback, useState } from 'react'
import { StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { CounterSurface } from './components/CounterSurface'
import { vibrateTap } from './lib/haptics'
import { colors } from './theme'

export default function App() {
  const [count, setCount] = useState(0)

  const increment = useCallback(() => {
    setCount((current) => current + 1)
    vibrateTap()
  }, [])

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <CounterSurface count={count} onIncrement={increment} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
})
