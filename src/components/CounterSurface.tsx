import { useMemo } from 'react'
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../theme'
import { CounterCircle, type DragBounds } from './CounterCircle'

/** Circle size as a share of the screen's shorter side, capped on tablets. */
const CIRCLE_SIZE_RATIO = 0.56
const CIRCLE_MAX_SIZE = 380
/** Space kept between a dragged circle and the safe edges of the screen. */
const EDGE_MARGIN = 12
/** Fade-out of the hint once counting starts. */
const HINT_FADE_MS = 700

type CounterSurfaceProps = {
  count: number
  onIncrement: () => void
}

/** The full-screen dark surface: the counter circle, centered at first, and the start hint. */
export function CounterSurface({ count, onIncrement }: CounterSurfaceProps) {
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const diameter = Math.min(Math.min(width, height) * CIRCLE_SIZE_RATIO, CIRCLE_MAX_SIZE)

  // How far the circle may travel from the screen center while staying inside the safe area.
  const bounds = useMemo<DragBounds>(() => {
    const reachX = width / 2 - diameter / 2 - EDGE_MARGIN
    const reachY = height / 2 - diameter / 2 - EDGE_MARGIN
    return {
      minX: -Math.max(reachX - insets.left, 0),
      maxX: Math.max(reachX - insets.right, 0),
      minY: -Math.max(reachY - insets.top, 0),
      maxY: Math.max(reachY - insets.bottom, 0),
    }
  }, [width, height, diameter, insets.top, insets.right, insets.bottom, insets.left])

  const showHint = count === 0
  const hintStyle = useAnimatedStyle(() => ({
    opacity: withTiming(showHint ? 1 : 0, {
      duration: HINT_FADE_MS,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }),
  }))

  return (
    <View style={styles.surface}>
      {/* Drawn first, so a circle dragged over it stays on top and tappable. */}
      <Animated.View
        aria-hidden
        style={[styles.hint, { paddingBottom: insets.bottom + 32 }, hintStyle]}
      >
        <Text style={styles.hintText}>Tap to count</Text>
        <Text style={styles.hintText}>Hold to move</Text>
      </Animated.View>

      <CounterCircle
        count={count}
        onIncrement={onIncrement}
        diameter={diameter}
        bounds={bounds}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  surface: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  hint: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 24,
  },
  hintText: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.35,
    textAlign: 'center',
  },
})
