import { useEffect } from 'react'
import { Easing, type SharedValue, useSharedValue, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

/** What every tap effect is given. */
export type TapEffectProps = {
  id: number
  /** The counter circle's diameter; effects are laid out around its center. */
  diameter: number
  /** The tap completed a round, so the effect plays bigger and brighter. */
  strong: boolean
  /** The circle's own scale, which an effect may play to make the tap felt. */
  circleScale: SharedValue<number>
  onDone: (id: number) => void
}

/**
 * Milliseconds since the effect started. It runs once to `duration`, then reports the effect done.
 * With Reduce Motion on it jumps straight to the end, so nothing is drawn.
 */
export function useEffectClock(
  duration: number,
  id: number,
  onDone: (id: number) => void,
): SharedValue<number> {
  const elapsed = useSharedValue(0)

  useEffect(() => {
    elapsed.set(
      withTiming(duration, { duration, easing: Easing.linear }, (finished) => {
        if (finished) scheduleOnRN(onDone, id)
      }),
    )
  }, [duration, elapsed, id, onDone])

  return elapsed
}

/** Progress from 0 to 1 of a stage that starts `delay` ms into the effect and lasts `duration` ms. */
export function stage(elapsed: number, delay: number, duration: number): number {
  'worklet'
  return Math.min(Math.max((elapsed - delay) / duration, 0), 1)
}

/** Opacity over a stage: a quick rise to `peak` over the first `rise` of it, then a long fade. */
export function swell(progress: number, peak: number, rise = 0.08, fade = 1.3): number {
  'worklet'
  if (progress <= 0 || progress >= 1) return 0
  return peak * Math.min(progress / rise, 1) * (1 - progress) ** fade
}

/** Seeded pseudo-random numbers in [0, 1), so an effect's scatter stays put across renders. */
export function seededRandom(seed: number): () => number {
  let state = (seed * 2654435761 + 0x9e3779b9) >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Absolute placement of a square layer of `size`, centered on the circle. */
export function centered(diameter: number, size: number) {
  const offset = (diameter - size) / 2
  return { position: 'absolute', left: offset, top: offset, width: size, height: size } as const
}
