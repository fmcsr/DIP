import { useMemo } from 'react'
import Animated, { Easing, type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { BLACK, mix, type Rgb, rgba, type Theme, useTheme, WHITE } from '../../theme'
import { centered, stage, swell, type TapEffectProps, useEffectClock } from './clock'

const easeOut = Easing.out(Easing.cubic)

/**
 * One wave: when it starts and how long it travels, its size at both ends (times the circle's),
 * its peak opacity and how wide its band is, as a share of its radius.
 */
type Wave = { delay: number; duration: number; from: number; to: number; peak: number; band: number }

/** The crater rim of an impact is wide; travelling waves are narrow. */
const IMPACT_BAND = 0.26
const WAVE_BAND = 0.085
const FLASH_MS = 260
/**
 * Where every gradient here has faded out, in percent of its radius. iOS fills past a gradient's
 * end with a color sampled just before it; a short clear stretch keeps that sample clear, or a
 * sharp edge would tint the whole square layer.
 */
const GRADIENT_END = 97

function waterWaves(strong: boolean): Wave[] {
  // The drop hits the middle: a crater rim races out to the circle's edge…
  const waves: Wave[] = [
    { delay: 0, duration: 380, from: 0.12, to: 1, peak: strong ? 0.75 : 0.6, band: IMPACT_BAND },
  ]
  // …and leaves the circle as a train of waves, the first one fastest and brightest.
  const peaks = strong ? [0.9, 0.7, 0.52, 0.38, 0.26] : [0.7, 0.5, 0.34, 0.22]
  peaks.forEach((peak, index) => {
    waves.push({
      delay: 170 + index * 95,
      duration: 2300 + index * 260,
      from: 1.02,
      to: 3.6 - index * 0.3,
      peak,
      band: WAVE_BAND,
    })
  })
  // The droplet that bounces back up falls into the middle again: a second, smaller plop.
  waves.push(
    { delay: 470, duration: 320, from: 0.1, to: 0.75, peak: 0.42, band: IMPACT_BAND },
    { delay: 620, duration: 1900, from: 1.02, to: 2.6, peak: 0.34, band: WAVE_BAND },
    { delay: 720, duration: 1900, from: 1.02, to: 2.35, peak: 0.22, band: WAVE_BAND },
  )
  return waves
}

type Look = { crest: Rgb; trough: Rgb; troughAlpha: number; flash: string }

// Dark water shows its waves by the light on their crests; light water by the shade in their
// troughs, so each mode leans on the other side of the wave.
function waterLook({ mode, accent }: Theme): Look {
  if (mode === 'dark') {
    const crest = mix(accent, WHITE, 0.4)
    return { crest, trough: BLACK, troughAlpha: 0.55, flash: centerLight(crest, 0.55) }
  }
  const trough = mix(accent, BLACK, 0.25)
  return { crest: WHITE, trough, troughAlpha: 0.45, flash: centerLight(trough, 0.3) }
}

function centerLight(color: Rgb, alpha: number): string {
  return `radial-gradient(circle closest-side, ${rgba(color, alpha)} 0%, ${rgba(color, alpha * 0.3)} 45%, ${rgba(color, 0)} ${GRADIENT_END}%, ${rgba(color, 0)} 100%)`
}

/** A soft ring near the edge of its layer: the trough's shade inside, the crest's light outside. */
function waveBand({ crest, trough, troughAlpha }: Look, band: number): string {
  const at = (share: number) => `${(GRADIENT_END - band * share * 100).toFixed(2)}%`
  return `radial-gradient(circle closest-side, ${rgba(trough, 0)} ${at(1)}, ${rgba(trough, troughAlpha)} ${at(0.6)}, ${rgba(crest, 1)} ${at(0.22)}, ${rgba(crest, 0)} ${GRADIENT_END}%, ${rgba(crest, 0)} 100%)`
}

/**
 * A drop falling into still water: the impact flashes and its crater rim spreads to the circle's
 * edge, a train of waves rolls out, and the droplet that bounced back up plops into the middle
 * once more.
 */
export function Water({ id, diameter, strong, onDone }: TapEffectProps) {
  const theme = useTheme()
  const look = useMemo(() => waterLook(theme), [theme])
  const waves = useMemo(() => waterWaves(strong), [strong])
  const duration = Math.max(...waves.map((wave) => wave.delay + wave.duration))
  const elapsed = useEffectClock(duration, id, onDone)

  return (
    <>
      <Flash elapsed={elapsed} diameter={diameter} image={look.flash} />
      {waves.map((wave, index) => (
        <WaveRing
          key={index}
          elapsed={elapsed}
          wave={wave}
          diameter={diameter}
          image={waveBand(look, wave.band)}
        />
      ))}
    </>
  )
}

type LayerProps = { elapsed: SharedValue<number>; diameter: number }

function Flash({ elapsed, diameter, image }: LayerProps & { image: string }) {
  const style = useAnimatedStyle(() => {
    const progress = stage(elapsed.get(), 0, FLASH_MS)
    return {
      opacity: swell(progress, 1, 0.12, 1.5),
      transform: [{ scale: 0.3 + 0.85 * easeOut(progress) }],
    }
  })

  return (
    <Animated.View style={[centered(diameter, diameter * 0.5), { backgroundImage: image }, style]} />
  )
}

function WaveRing({ elapsed, diameter, wave, image }: LayerProps & { wave: Wave; image: string }) {
  const style = useAnimatedStyle(() => {
    const progress = stage(elapsed.get(), wave.delay, wave.duration)
    return {
      opacity: swell(progress, wave.peak, 0.1, 1.4),
      transform: [{ scale: wave.from + (wave.to - wave.from) * easeOut(progress) }],
    }
  })

  return <Animated.View style={[centered(diameter, diameter), { backgroundImage: image }, style]} />
}
