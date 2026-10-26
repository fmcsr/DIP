import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Appearance, StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { CounterSurface } from './components/CounterSurface'
import type { TapEffect } from './components/effects'
import { SettingsSheet } from './components/SettingsSheet'
import { vibrateRound, vibrateTap } from './lib/haptics'
import { useCounter } from './lib/useCounter'
import { type AccentId, buildTheme, type ColorMode, ThemeProvider } from './theme'

export default function App() {
  const counter = useCounter()
  const [accent, setAccent] = useState<AccentId>('mono')
  const [mode, setMode] = useState<ColorMode>('dark')
  const [effect, setEffect] = useState<TapEffect>('water')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const theme = useMemo(() => buildTheme(mode, accent), [mode, accent])
  const { tap } = counter

  // System dialogs and the keyboard follow the chosen mode, not the phone's.
  useEffect(() => {
    Appearance.setColorScheme(mode)
  }, [mode])

  const handleTap = useCallback(() => {
    const completedRound = tap()
    if (completedRound) vibrateRound()
    else vibrateTap()
    return completedRound
  }, [tap])

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: theme.surface }]}>
      <SafeAreaProvider>
        <ThemeProvider value={theme}>
          <StatusBar style={theme.statusBar} />
          <CounterSurface
            count={counter.count}
            rounds={counter.rounds}
            target={counter.settings.target}
            effect={effect}
            showHint={counter.untouched}
            onTap={handleTap}
            onOpenSettings={() => setSettingsOpen(true)}
          />
          <SettingsSheet
            visible={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            counterSettings={counter.settings}
            onCounterSettingsChange={counter.configure}
            recentTargets={counter.recentTargets}
            onRememberTarget={counter.rememberTarget}
            onReset={counter.reset}
            accent={accent}
            onAccentChange={setAccent}
            mode={mode}
            onModeChange={setMode}
            effect={effect}
            onEffectChange={setEffect}
          />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
})
