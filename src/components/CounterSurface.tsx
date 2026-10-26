import { useMemo } from 'react'
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../theme'
import { CounterCircle, type DragBounds } from './CounterCircle'
import type { TapEffect } from './effects'
import { SettingsButton } from './SettingsButton'

/** Circle size as a share of the screen's shorter side, capped on tablets. */
const CIRCLE_SIZE_RATIO = 0.56
const CIRCLE_MAX_SIZE = 380
/** Space kept between a dragged circle and the safe edges of the screen. */
const EDGE_MARGIN = 12
/** Strip kept free at the top for the settings button; the circle can't be dragged into it. */
const TOP_BAR_HEIGHT = 56
/** Fade-out of the hint once counting starts. */
const HINT_FADE_MS = 700

type CounterSurfaceProps = {
  count: number
  rounds: number
  target: number | null
  effect: TapEffect
  /** Nothing has been counted yet, so the hint explains what to do. */
  showHint: boolean
  onTap: () => boolean
  onOpenSettings: () => void
}

/** The full-screen surface: the counter circle, centered at first, the settings button and the hint. */
export function CounterSurface({
  count,
  rounds,
  target,
  effect,
  showHint,
  onTap,
  onOpenSettings,
}: CounterSurfaceProps) {
  const theme = useTheme()
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const diameter = Math.min(Math.min(width, height) * CIRCLE_SIZE_RATIO, CIRCLE_MAX_SIZE)

  // How far the circle may travel from the screen center while staying inside the safe area
  // and below the settings button.
  const bounds = useMemo<DragBounds>(() => {
    const reachX = width / 2 - diameter / 2 - EDGE_MARGIN
    const reachY = height / 2 - diameter / 2 - EDGE_MARGIN
    return {
      minX: -Math.max(reachX - insets.left, 0),
      maxX: Math.max(reachX - insets.right, 0),
      minY: -Math.max(reachY - insets.top - TOP_BAR_HEIGHT, 0),
      maxY: Math.max(reachY - insets.bottom, 0),
    }
  }, [width, height, diameter, insets.top, insets.right, insets.bottom, insets.left])

  const hintStyle = useAnimatedStyle(() => ({
    opacity: withTiming(showHint ? 1 : 0, {
      duration: HINT_FADE_MS,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }),
  }))

  return (
    <View style={[styles.surface, { backgroundColor: theme.surface }]}>
      {/* Drawn first, so a circle dragged over it stays on top and tappable. */}
      <Animated.View
        aria-hidden
        style={[styles.hint, { paddingBottom: insets.bottom + 32 }, hintStyle]}
      >
        <Text style={[styles.hintText, { color: theme.inkMuted }]}>Tap to count</Text>
        <Text style={[styles.hintText, { color: theme.inkMuted }]}>Hold to move</Text>
      </Animated.View>

      <CounterCircle
        count={count}
        rounds={rounds}
        target={target}
        effect={effect}
        diameter={diameter}
        bounds={bounds}
        onTap={onTap}
      />

      <SettingsButton
        onPress={onOpenSettings}
        style={[styles.settings, { top: insets.top + 6, right: insets.right + 10 }]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  surface: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 24,
  },
  hintText: {
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.35,
    textAlign: 'center',
  },
  settings: {
    position: 'absolute',
  },
})
