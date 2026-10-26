import { useMemo } from 'react'
import Animated, { Easing, type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { mix, rgba, type Theme, useTheme, WHITE } from '../../theme'
import { centered, stage, swell, type TapEffectProps, useEffectClock } from './clock'

const PULSE_MS = 1800
const INNER_MS = 700

const easeOut = Easing.out(Easing.cubic)

/** A wave of light: when it leaves, how far it spreads (times the circle's size), how bright. */
type Pulse = { delay: number; reach: number; peak: number }

const PULSES: Pulse[] = [{ delay: 0, reach: 2.6, peak: 0.85 }]
/** A completed round breathes out twice, wider. */
const ROUND_PULSES: Pulse[] = [
  { delay: 0, reach: 2.7, peak: 0.95 },
  { delay: 300, reach: 3.2, peak: 0.8 },
]

function glowLook({ mode, accent }: Theme) {
  const light = mode === 'dark' ? mix(accent, WHITE, 0.55) : WHITE
  // Colored light reads stronger on a light background, so it is dimmed there.
  const strength = mode === 'dark' ? 1 : 0.7
  return {
    // Each fades out a little before its edge: iOS fills past a gradient's end with a color sampled
    // just before it, which would otherwise tint the square layer's corners.
    inner: `radial-gradient(circle closest-side, ${rgba(light, 0.6 * strength)} 0%, ${rgba(accent, 0.2 * strength)} 58%, ${rgba(accent, 0)} 96%, ${rgba(accent, 0)} 100%)`,
    halo: `radial-gradient(circle closest-side, ${rgba(accent, 0)} 46%, ${rgba(accent, 0.58 * strength)} 74%, ${rgba(accent, 0.2 * strength)} 87%, ${rgba(accent, 0)} 96%, ${rgba(accent, 0)} 100%)`,
  }
}

/**
 * Glow: the circle lights up from within and breathes a soft wave of light outward. Nothing in it
 * has a hard edge, so the light has no visible start or end.
 */
export function Glow({ id, diameter, strong, onDone }: TapEffectProps) {
  const theme = useTheme()
  const look = useMemo(() => glowLook(theme), [theme])
  const pulses = strong ? ROUND_PULSES : PULSES
  const elapsed = useEffectClock(pulses[pulses.length - 1].delay + PULSE_MS, id, onDone)

  return (
    <>
      <InnerLight
        elapsed={elapsed}
        diameter={diameter}
        image={look.inner}
        peak={strong ? 1 : 0.85}
      />
      {pulses.map((pulse, index) => (
        <Halo key={index} elapsed={elapsed} diameter={diameter} pulse={pulse} image={look.halo} />
      ))}
    </>
  )
}

type LayerProps = { elapsed: SharedValue<number>; diameter: number; image: string }

function InnerLight({ elapsed, diameter, image, peak }: LayerProps & { peak: number }) {
  const style = useAnimatedStyle(() => {
    const progress = stage(elapsed.get(), 0, INNER_MS)
    return {
      opacity: swell(progress, peak, 0.2, 1.6),
      transform: [{ scale: 0.55 + 0.45 * easeOut(progress) }],
    }
  })

  return <Animated.View style={[centered(diameter, diameter), { backgroundImage: image }, style]} />
}

function Halo({ elapsed, diameter, pulse, image }: LayerProps & { pulse: Pulse }) {
  const style = useAnimatedStyle(() => {
    const progress = stage(elapsed.get(), pulse.delay, PULSE_MS)
    return {
      opacity: swell(progress, pulse.peak, 0.1, 1.5),
      transform: [{ scale: 1 + (pulse.reach - 1) * easeOut(progress) }],
    }
  })

  return <Animated.View style={[centered(diameter, diameter), { backgroundImage: image }, style]} />
}
