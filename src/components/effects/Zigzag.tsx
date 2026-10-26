import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { Easing, type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { rgba, useTheme } from '../../theme'
import { centered, stage, swell, type TapEffectProps, useEffectClock } from './clock'

const TEETH = 24
const STROKE = 1.3
/** Tooth height as a share of the circle's diameter. */
const AMPLITUDE = 0.045
/** How far along each edge, from both of its ends, the corners are rounded off. */
const ROUNDING = 0.25
/** Strokes per rounded corner; enough that the curve stays smooth while the ring grows. */
const CORNER_STROKES = 3
const RING_MS = 2000
const STAGGER_MS = 150
/** Peak opacity of each ring, leading wave first. */
const PEAKS = [0.85, 0.55]
const ROUND_PEAKS = [1, 0.75, 0.5]
/** How far a ring turns while it travels; every other one turns the other way. */
const TURN_DEG = 16

const easeOut = Easing.out(Easing.quad)

type Point = { x: number; y: number }
type Segment = { left: number; top: number; length: number; angle: number }
type Shape = { size: number; segments: Segment[] }

function towards(from: Point, to: Point, share: number): Point {
  return { x: from.x + (to.x - from.x) * share, y: from.y + (to.y - from.y) * share }
}

/** A point `t` of the way along the curve from `start` to `end` that `pull` bends toward itself. */
function curve(start: Point, pull: Point, end: Point, t: number): Point {
  const a = (1 - t) ** 2
  const b = 2 * (1 - t) * t
  const c = t ** 2
  return { x: a * start.x + b * pull.x + c * end.x, y: a * start.y + b * pull.y + c * end.y }
}

/**
 * Short straight strokes tracing a zigzag around the circle, valleys on its edge and peaks outside.
 * Every corner is cut back along both of its edges and bridged by a curve that bends toward it, so
 * the tips come out rounded instead of sharp.
 */
function zigzag(diameter: number): Shape {
  const radius = diameter / 2
  const amplitude = diameter * AMPLITUDE
  const size = Math.ceil(2 * (radius + amplitude + STROKE))
  const center = size / 2
  const corners = Array.from({ length: TEETH * 2 }, (_, index) => {
    const angle = (Math.PI * index) / TEETH
    const distance = radius + (index % 2 === 0 ? amplitude : 0)
    return { x: center + Math.cos(angle) * distance, y: center + Math.sin(angle) * distance }
  })
  const points = corners.flatMap((corner, index) => {
    const before = towards(corner, corners[(index + corners.length - 1) % corners.length], ROUNDING)
    const after = towards(corner, corners[(index + 1) % corners.length], ROUNDING)
    return Array.from({ length: CORNER_STROKES + 1 }, (_, step) =>
      curve(before, corner, after, step / CORNER_STROKES),
    )
  })
  const segments = points.map((from, index) => {
    const to = points[(index + 1) % points.length]
    // A stroke's width longer than the gap, so neighbors overlap at the joints.
    const length = Math.hypot(to.x - from.x, to.y - from.y) + STROKE
    return {
      left: (from.x + to.x) / 2 - length / 2,
      top: (from.y + to.y) / 2 - STROKE / 2,
      length,
      angle: Math.atan2(to.y - from.y, to.x - from.x),
    }
  })
  return { size, segments }
}

/** Zigzag waves: soft-toothed rings leave the circle and turn as they spread. */
export function Zigzag({ id, diameter, strong, onDone }: TapEffectProps) {
  const theme = useTheme()
  const shape = useMemo(() => zigzag(diameter), [diameter])
  const peaks = strong ? ROUND_PEAKS : PEAKS
  const elapsed = useEffectClock(RING_MS + STAGGER_MS * (peaks.length - 1), id, onDone)

  return peaks.map((peak, index) => (
    <ZigzagRing
      key={index}
      index={index}
      peak={peak}
      elapsed={elapsed}
      diameter={diameter}
      shape={shape}
      color={rgba(theme.accent, 1)}
    />
  ))
}

type ZigzagRingProps = {
  index: number
  peak: number
  elapsed: SharedValue<number>
  diameter: number
  shape: Shape
  color: string
}

function ZigzagRing({ index, peak, elapsed, diameter, shape, color }: ZigzagRingProps) {
  const direction = index % 2 === 0 ? 1 : -1
  // Half a tooth apart, so consecutive rings interleave.
  const startDeg = (index * 180) / TEETH
  const reach = 2.9 - index * 0.25

  const style = useAnimatedStyle(() => {
    const progress = stage(elapsed.get(), index * STAGGER_MS, RING_MS)
    const eased = easeOut(progress)
    return {
      opacity: swell(progress, peak, 0.06, 1.1),
      transform: [
        { rotate: `${startDeg + direction * TURN_DEG * eased}deg` },
        { scale: 1 + (reach - 1) * eased },
      ],
    }
  })

  return (
    <Animated.View style={[centered(diameter, shape.size), style]}>
      {shape.segments.map((segment, key) => (
        <View
          key={key}
          style={[
            styles.segment,
            {
              left: segment.left,
              top: segment.top,
              width: segment.length,
              backgroundColor: color,
              transform: [{ rotate: `${segment.angle}rad` }],
            },
          ]}
        />
      ))}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  segment: {
    position: 'absolute',
    height: STROKE,
    borderRadius: STROKE / 2,
  },
})
