import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { colors } from '../theme'

/** Peak opacity of each ring in one ripple, leading wave first. */
const RING_OPACITIES = [0.5, 0.3, 0.16]
/** Gap between consecutive rings, like the trailing waves of a water drop. */
const RING_STAGGER_MS = 180
const RING_DURATION_MS = 2600
/** How far a ring travels, as a multiple of the circle's size: out to the screen's edges. */
const RING_MAX_SCALE = 3.4
const RING_WIDTH = 1.25
const RIPPLE_DURATION_MS = RING_DURATION_MS + RING_STAGGER_MS * (RING_OPACITIES.length - 1)

// A gentle slowdown, so the rings keep visibly travelling until they fade.
const easeOut = Easing.out(Easing.quad)

type RippleProps = {
  id: number
  diameter: number
  onDone: (id: number) => void
}

/**
 * One water-drop ripple: concentric rings leave the circle's edge one after another, slow down
 * and fade. With Reduce Motion on, the animation ends at once and nothing is drawn.
 */
export function Ripple({ id, diameter, onDone }: RippleProps) {
  const elapsed = useSharedValue(0)

  useEffect(() => {
    elapsed.set(
      withTiming(
        RIPPLE_DURATION_MS,
        { duration: RIPPLE_DURATION_MS, easing: Easing.linear },
        (finished) => {
          if (finished) scheduleOnRN(onDone, id)
        },
      ),
    )
  }, [elapsed, id, onDone])

  return RING_OPACITIES.map((peakOpacity, index) => (
    <Ring
      key={index}
      elapsed={elapsed}
      delay={index * RING_STAGGER_MS}
      peakOpacity={peakOpacity}
      diameter={diameter}
    />
  ))
}

type RingProps = {
  elapsed: SharedValue<number>
  delay: number
  peakOpacity: number
  diameter: number
}

function Ring({ elapsed, delay, peakOpacity, diameter }: RingProps) {
  const style = useAnimatedStyle(() => {
    const progress = Math.min(Math.max((elapsed.get() - delay) / RING_DURATION_MS, 0), 1)
    return {
      opacity: progress === 0 ? 0 : peakOpacity * (1 - progress),
      transform: [{ scale: 1 + (RING_MAX_SCALE - 1) * easeOut(progress) }],
    }
  })

  return (
    <Animated.View
      style={[
        styles.ring,
        { width: diameter, height: diameter, borderRadius: diameter / 2 },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderWidth: RING_WIDTH,
    borderColor: colors.ink,
  },
})
