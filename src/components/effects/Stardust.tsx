import { useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { mix, rgba, type Theme, useTheme, WHITE } from '../../theme'
import { centered, seededRandom, stage, swell, type TapEffectProps, useEffectClock } from './clock'

const GLINT_MS = 700
const GLINT_STROKE = 2
/** How far the circle shrinks before it springs back; a completed round squeezes deeper. */
const SQUEEZE = 0.92
const ROUND_SQUEEZE = 0.88
const SQUEEZE_MS = 90
/** Loose enough to overshoot and settle: smaller, bigger, a touch smaller, still. */
const BOUNCE_SPRING = { damping: 7, stiffness: 320, mass: 0.7 }

const easeOut = Easing.out(Easing.cubic)

/** A speck of light drifting off the rim, curving a little and twinkling as it fades. */
type Mote = {
  angle: number
  from: number
  travel: number
  swirl: number
  delay: number
  duration: number
  size: number
  /** Twinkles per second. */
  twinkle: number
  phase: number
}

/** A four-pointed star that flashes once just outside the circle. */
type Glint = { x: number; y: number; delay: number; size: number }

function stardustPlan(id: number, diameter: number, strong: boolean) {
  const radius = diameter / 2
  const random = seededRandom(id)
  const motes: Mote[] = Array.from({ length: strong ? 34 : 22 }, () => ({
    angle: random() * Math.PI * 2,
    from: radius * (0.9 + random() * 0.12),
    travel: radius * (0.3 + random() * 0.6) * (strong ? 1.3 : 1),
    swirl: (random() - 0.5) * 0.7,
    delay: random() * 90,
    duration: 1000 + random() * 900,
    size: 12 + random() * 12,
    twinkle: 3 + random() * 5,
    phase: random() * Math.PI * 2,
  }))
  const glints: Glint[] = Array.from({ length: strong ? 7 : 4 }, () => {
    const angle = random() * Math.PI * 2
    const distance = radius * (1.08 + random() * 0.5)
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      delay: 80 + random() * 420,
      size: 18 + random() * 14,
    }
  })
  const duration = Math.max(
    ...motes.map((mote) => mote.delay + mote.duration),
    ...glints.map((glint) => glint.delay + GLINT_MS),
  )
  return { motes, glints, duration }
}

function stardustLook({ mode, accent }: Theme) {
  const core = mode === 'dark' ? mix(accent, WHITE, 0.75) : accent
  const bar = (direction: number) =>
    `linear-gradient(${direction}deg, ${rgba(core, 0)} 0%, ${rgba(core, 1)} 50%, ${rgba(core, 0)} 100%)`
  return {
    // Fades out before its edge: iOS fills past a gradient's end with a color sampled just before
    // it, which would otherwise show the square layer's corners.
    mote: `radial-gradient(circle closest-side, ${rgba(core, 1)} 0%, ${rgba(core, 1)} 14%, ${rgba(accent, 0.6)} 30%, ${rgba(accent, 0.2)} 58%, ${rgba(accent, 0)} 94%, ${rgba(accent, 0)} 100%)`,
    horizontal: bar(90),
    vertical: bar(180),
  }
}

/**
 * Stardust: the circle gives under the tap and bounces back, while specks of light scatter from
 * its rim, twinkling, and a few stars glint nearby.
 */
export function Stardust({ id, diameter, strong, circleScale, onDone }: TapEffectProps) {
  const theme = useTheme()
  const look = useMemo(() => stardustLook(theme), [theme])
  const plan = useMemo(() => stardustPlan(id, diameter, strong), [id, diameter, strong])
  const elapsed = useEffectClock(plan.duration, id, onDone)

  useEffect(() => {
    circleScale.set(
      withSequence(
        withTiming(strong ? ROUND_SQUEEZE : SQUEEZE, {
          duration: SQUEEZE_MS,
          easing: Easing.out(Easing.quad),
        }),
        withSpring(1, BOUNCE_SPRING),
      ),
    )
  }, [circleScale, strong])

  return (
    <>
      {plan.motes.map((mote, index) => (
        <MoteView
          key={`mote-${index}`}
          elapsed={elapsed}
          diameter={diameter}
          mote={mote}
          image={look.mote}
        />
      ))}
      {plan.glints.map((glint, index) => (
        <GlintView
          key={`glint-${index}`}
          elapsed={elapsed}
          diameter={diameter}
          glint={glint}
          horizontal={look.horizontal}
          vertical={look.vertical}
        />
      ))}
    </>
  )
}

type LayerProps = { elapsed: SharedValue<number>; diameter: number }

function MoteView({ elapsed, diameter, mote, image }: LayerProps & { mote: Mote; image: string }) {
  const style = useAnimatedStyle(() => {
    const time = elapsed.get()
    const progress = stage(time, mote.delay, mote.duration)
    const eased = easeOut(progress)
    const distance = mote.from + mote.travel * eased
    const angle = mote.angle + mote.swirl * eased
    const twinkle = 0.55 + 0.45 * Math.sin((time / 1000) * mote.twinkle * Math.PI * 2 + mote.phase)
    return {
      opacity: swell(progress, 1, 0.1, 1.1) * twinkle,
      transform: [
        { translateX: Math.cos(angle) * distance },
        { translateY: Math.sin(angle) * distance },
        { scale: 1.15 - 0.75 * progress },
      ],
    }
  })

  return (
    <Animated.View style={[centered(diameter, mote.size), { backgroundImage: image }, style]} />
  )
}

type GlintProps = LayerProps & { glint: Glint; horizontal: string; vertical: string }

function GlintView({ elapsed, diameter, glint, horizontal, vertical }: GlintProps) {
  const style = useAnimatedStyle(() => {
    const progress = stage(elapsed.get(), glint.delay, GLINT_MS)
    return {
      opacity: progress > 0 && progress < 1 ? 1 : 0,
      transform: [
        { translateX: glint.x },
        { translateY: glint.y },
        { rotate: `${45 * progress}deg` },
        { scale: Math.max(Math.sin(Math.PI * progress), 0.001) },
      ],
    }
  })

  const middle = glint.size / 2 - GLINT_STROKE / 2
  return (
    <Animated.View style={[centered(diameter, glint.size), style]}>
      <View style={[styles.horizontal, { top: middle, backgroundImage: horizontal }]} />
      <View style={[styles.vertical, { left: middle, backgroundImage: vertical }]} />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  horizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: GLINT_STROKE,
  },
  vertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: GLINT_STROKE,
  },
})
