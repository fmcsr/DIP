import { StyleSheet } from 'react-native'
import Animated, { Easing, type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { rgba, useTheme } from '../../theme'
import { stage, type TapEffectProps, useEffectClock } from './clock'

/** Peak opacity of each ring in one ripple, leading wave first. */
const RING_OPACITIES = [0.5, 0.3, 0.16]
/** A completed round sends out a brighter ripple with one more wave. */
const ROUND_RING_OPACITIES = [0.85, 0.6, 0.38, 0.2]
/** Gap between consecutive rings. */
const RING_STAGGER_MS = 180
const RING_DURATION_MS = 2600
/** How far a ring travels, as a multiple of the circle's size: out to the screen's edges. */
const RING_MAX_SCALE = 3.4
const RING_WIDTH = 1.25

// A gentle slowdown, so the rings keep visibly travelling until they fade.
const easeOut = Easing.out(Easing.quad)

/** Clean concentric rings leave the circle's edge one after another, slow down and fade. */
export function Ripple({ id, diameter, strong, onDone }: TapEffectProps) {
  const theme = useTheme()
  const opacities = strong ? ROUND_RING_OPACITIES : RING_OPACITIES
  const duration = RING_DURATION_MS + RING_STAGGER_MS * (opacities.length - 1)
  const elapsed = useEffectClock(duration, id, onDone)

  return opacities.map((peakOpacity, index) => (
    <Ring
      key={index}
      elapsed={elapsed}
      delay={index * RING_STAGGER_MS}
      peakOpacity={peakOpacity}
      diameter={diameter}
      color={rgba(theme.accent, 1)}
    />
  ))
}

type RingProps = {
  elapsed: SharedValue<number>
  delay: number
  peakOpacity: number
  diameter: number
  color: string
}

function Ring({ elapsed, delay, peakOpacity, diameter, color }: RingProps) {
  const style = useAnimatedStyle(() => {
    const progress = stage(elapsed.get(), delay, RING_DURATION_MS)
    return {
      opacity: progress === 0 ? 0 : peakOpacity * (1 - progress),
      transform: [{ scale: 1 + (RING_MAX_SCALE - 1) * easeOut(progress) }],
    }
  })

  return (
    <Animated.View
      style={[
        styles.ring,
        { width: diameter, height: diameter, borderRadius: diameter / 2, borderColor: color },
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
  },
})
