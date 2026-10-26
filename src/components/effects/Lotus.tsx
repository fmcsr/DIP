import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import Animated, { Easing, type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { mix, rgba, type Theme, useTheme, WHITE } from '../../theme'
import { stage, swell, type TapEffectProps, useEffectClock } from './clock'

const PETAL_MS = 1500
/** Petals open one after another around the circle, starting at the top. */
const PETAL_STAGGER_MS = 24
/** How far a petal turns as it unfurls. */
const OPEN_DEG = 16

const easeOut = Easing.out(Easing.cubic)

/** A petal is a square with two opposite corners fully rounded: a leaf from corner to corner. */
type Petal = { left: number; top: number; size: number; axisDeg: number; delay: number; peak: number }

/** A ring of petals: how many, their size (times the circle's), where they start, how bright. */
type Whorl = { count: number; size: number; offset: number; delay: number; peak: number }

// Two whorls, the inner one between the outer one's petals, like a lotus seen from above.
const WHORLS: Whorl[] = [
  { count: 8, size: 0.36, offset: 0, delay: 0, peak: 0.9 },
  { count: 8, size: 0.25, offset: 0.5, delay: 110, peak: 0.7 },
]
/** A completed round opens wider, with a third whorl of small petals. */
const ROUND_WHORLS: Whorl[] = [
  { count: 8, size: 0.42, offset: 0, delay: 0, peak: 1 },
  { count: 8, size: 0.3, offset: 0.5, delay: 110, peak: 0.85 },
  { count: 16, size: 0.18, offset: 0.25, delay: 220, peak: 0.6 },
]
/** Petals grow from just inside the circle's edge, so they look attached to it. */
const BASE_RADIUS = 0.94

function lotusPlan(diameter: number, strong: boolean): Petal[] {
  const radius = diameter / 2
  const base = radius * BASE_RADIUS
  return (strong ? ROUND_WHORLS : WHORLS).flatMap((whorl) =>
    Array.from({ length: whorl.count }, (_, index) => {
      const angle = ((index + whorl.offset) / whorl.count) * Math.PI * 2 - Math.PI / 2
      const size = diameter * whorl.size
      // The petal's base is its bottom-left corner, placed by the circle's edge: it grows and
      // turns from there. Its tip, the top-right corner, points 45° up from the base.
      return {
        left: radius + Math.cos(angle) * base,
        top: radius + Math.sin(angle) * base - size,
        size,
        axisDeg: (angle * 180) / Math.PI + 45,
        delay: whorl.delay + index * PETAL_STAGGER_MS,
        peak: whorl.peak,
      }
    }),
  )
}

function lotusLook({ mode, accent }: Theme) {
  const line = mode === 'dark' ? mix(accent, WHITE, 0.3) : accent
  return {
    line: rgba(line, 0.9),
    // Faint at the base, brighter toward the tip.
    fill: `linear-gradient(45deg, ${rgba(accent, 0.04)} 0%, ${rgba(accent, mode === 'dark' ? 0.34 : 0.24)} 100%)`,
  }
}

/** Lotus: petals unfold from the circle's edge one after another, open and fade. */
export function Lotus({ id, diameter, strong, onDone }: TapEffectProps) {
  const theme = useTheme()
  const look = useMemo(() => lotusLook(theme), [theme])
  const petals = useMemo(() => lotusPlan(diameter, strong), [diameter, strong])
  const duration = Math.max(...petals.map((petal) => petal.delay)) + PETAL_MS
  const elapsed = useEffectClock(duration, id, onDone)

  return petals.map((petal, index) => (
    <PetalView key={index} elapsed={elapsed} petal={petal} line={look.line} fill={look.fill} />
  ))
}

type PetalProps = { elapsed: SharedValue<number>; petal: Petal; line: string; fill: string }

function PetalView({ elapsed, petal, line, fill }: PetalProps) {
  const style = useAnimatedStyle(() => {
    const progress = stage(elapsed.get(), petal.delay, PETAL_MS)
    const eased = easeOut(progress)
    // Drifts outward along its own axis while it opens.
    const drift = (petal.size * 0.35 * eased) / Math.SQRT2
    return {
      opacity: swell(progress, petal.peak, 0.18, 1.3),
      transform: [
        { rotate: `${petal.axisDeg - OPEN_DEG * (1 - eased)}deg` },
        { translateX: drift },
        { translateY: -drift },
        { scale: 0.35 + 0.65 * eased },
      ],
    }
  })

  return (
    <Animated.View
      style={[
        styles.petal,
        {
          left: petal.left,
          top: petal.top,
          width: petal.size,
          height: petal.size,
          borderTopLeftRadius: petal.size,
          borderBottomRightRadius: petal.size,
          borderColor: line,
          backgroundImage: fill,
        },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  petal: {
    position: 'absolute',
    borderWidth: 1,
    transformOrigin: 'left bottom',
  },
})
