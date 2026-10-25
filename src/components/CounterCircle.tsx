import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  type AccessibilityActionEvent,
  type AccessibilityActionInfo,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  GestureDetector,
  GestureStateManager,
  useCompetingGestures,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { vibratePickup } from '../lib/haptics'
import { colors, ink } from '../theme'
import { Ripple } from './Ripple'

/** Holding the circle this long picks it up to be moved instead of counting. */
const LONG_PRESS_MS = 450
/** Ripples alive at once; when tapping very fast the oldest one is dropped. */
const MAX_RIPPLES = 12
/** Share of the circle's width the number may take, and its height cap. */
const COUNT_WIDTH_RATIO = 0.7
const COUNT_MAX_HEIGHT_RATIO = 0.52
/** Advance width of one tabular digit in em, rounded up from common system fonts. */
const DIGIT_WIDTH_EM = 0.62
const RING_WIDTH = 1.25
const FOCUS_RING_GAP = 8

const PRESS_SPRING = { damping: 14, stiffness: 260 }
const LIFT_SPRING = { damping: 16, stiffness: 220 }

const ACTIVATE_ACTION: AccessibilityActionInfo[] = [{ name: 'activate' }]

/** How far the circle's center may move from the screen center. */
export type DragBounds = { minX: number; maxX: number; minY: number; maxY: number }

// Shrinks with the digit count so long numbers stay inside the circle. Sized for at least two
// digits so the number doesn't jump when going from 9 to 10.
function countFontSize(count: number, diameter: number): number {
  const digits = Math.max(String(count).length, 2)
  return Math.min(
    (diameter * COUNT_WIDTH_RATIO) / (digits * DIGIT_WIDTH_EM),
    diameter * COUNT_MAX_HEIGHT_RATIO,
  )
}

function clamp(value: number, min: number, max: number): number {
  'worklet'
  return Math.min(Math.max(value, min), max)
}

type CounterCircleProps = {
  count: number
  onIncrement: () => void
  diameter: number
  bounds: DragBounds
}

/**
 * The counter: a circle that counts on a quick tap and sends out a ripple. Holding it picks it
 * up, so it can be dragged anywhere on screen without counting.
 */
export function CounterCircle({ count, onIncrement, diameter, bounds }: CounterCircleProps) {
  const radius = diameter / 2
  const offsetX = useSharedValue(0)
  const offsetY = useSharedValue(0)
  const dragOriginX = useSharedValue(0)
  const dragOriginY = useSharedValue(0)
  const limits = useSharedValue(bounds)
  const pressed = useSharedValue(0)
  const lifted = useSharedValue(0)
  const [ripples, setRipples] = useState<number[]>([])
  const nextRippleId = useRef(0)
  const [keyboardFocused, setKeyboardFocused] = useState(false)

  // Keep the circle on screen when the available space changes, e.g. on rotation.
  useEffect(() => {
    limits.set(bounds)
    offsetX.set(clamp(offsetX.get(), bounds.minX, bounds.maxX))
    offsetY.set(clamp(offsetY.get(), bounds.minY, bounds.maxY))
  }, [bounds, limits, offsetX, offsetY])

  const handleTap = useCallback(() => {
    onIncrement()
    const id = nextRippleId.current++
    setRipples((current) => [...current.slice(1 - MAX_RIPPLES), id])
  }, [onIncrement])

  const removeRipple = useCallback((id: number) => {
    setRipples((current) => current.filter((ripple) => ripple !== id))
  }, [])

  // Screen readers hear every new value, like a live region; the starting 0 is not announced.
  const announcedCount = useRef(count)
  useEffect(() => {
    if (count === announcedCount.current) return
    announcedCount.current = count
    AccessibilityInfo.announceForAccessibility(String(count))
  }, [count])

  // The view is square; only touches inside the circle itself count or drag.
  const isInsideCircle = (x: number, y: number) => {
    'worklet'
    return (x - radius) ** 2 + (y - radius) ** 2 <= radius ** 2
  }

  const tap = useTapGesture({
    maxDuration: LONG_PRESS_MS,
    onBegin: (event) => {
      if (!isInsideCircle(event.x, event.y)) {
        GestureStateManager.fail(event.handlerTag)
        return
      }
      pressed.set(withTiming(1, { duration: 90 }))
    },
    onActivate: () => {
      scheduleOnRN(handleTap)
    },
    onFinalize: () => {
      pressed.set(withSpring(0, PRESS_SPRING))
    },
  })

  const drag = usePanGesture({
    activateAfterLongPress: LONG_PRESS_MS,
    onBegin: (event) => {
      if (!isInsideCircle(event.x, event.y)) GestureStateManager.fail(event.handlerTag)
    },
    onActivate: () => {
      dragOriginX.set(offsetX.get())
      dragOriginY.set(offsetY.get())
      lifted.set(withSpring(1, LIFT_SPRING))
      scheduleOnRN(vibratePickup)
    },
    onUpdate: (event) => {
      const { minX, maxX, minY, maxY } = limits.get()
      offsetX.set(clamp(dragOriginX.get() + event.translationX, minX, maxX))
      offsetY.set(clamp(dragOriginY.get() + event.translationY, minY, maxY))
    },
    onFinalize: () => {
      lifted.set(withSpring(0, LIFT_SPRING))
    },
  })

  // Whichever wins first: a quick release counts, holding past LONG_PRESS_MS starts the drag.
  const gestures = useCompetingGestures(drag, tap)

  const positionStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.get() }, { translateY: offsetY.get() }],
  }))

  // Pressing sinks the circle slightly; picking it up lifts it and brightens its edge.
  const discStyle = useAnimatedStyle(() => ({
    transform: [{ scale: (1 - 0.035 * pressed.get()) * (1 + 0.06 * lifted.get()) }],
    borderColor: ink(0.28 + 0.32 * lifted.get()),
  }))

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'activate') handleTap()
  }

  // Hardware keyboards on Android click the focused view. Clicks that come from touches are
  // skipped, since the tap gesture already counted them.
  const handleClick = (event: { nativeEvent: object }) => {
    if ('pointerType' in event.nativeEvent) return
    handleTap()
  }

  const fontSize = countFontSize(count, diameter)
  const circleSize = { width: diameter, height: diameter, borderRadius: radius }

  return (
    <GestureDetector gesture={gestures}>
      <Animated.View
        accessible
        focusable
        role="button"
        aria-label="Increase count"
        aria-valuetext={String(count)}
        accessibilityActions={ACTIVATE_ACTION}
        onAccessibilityAction={handleAccessibilityAction}
        onClick={handleClick}
        onFocus={() => setKeyboardFocused(true)}
        onBlur={() => setKeyboardFocused(false)}
        style={[circleSize, positionStyle]}
      >
        {ripples.map((id) => (
          <Ripple key={id} id={id} diameter={diameter} onDone={removeRipple} />
        ))}

        <Animated.View style={[styles.disc, circleSize, discStyle]}>
          {/* Visual only: the circle itself carries the value for screen readers. */}
          <Text
            aria-hidden
            allowFontScaling={false}
            numberOfLines={1}
            style={[styles.count, { fontSize, letterSpacing: fontSize * -0.025 }]}
          >
            {count}
          </Text>
        </Animated.View>

        {/* Shown while a hardware keyboard focuses the circle on Android; iOS Full Keyboard
            Access draws its own system focus ring. */}
        {keyboardFocused && (
          <View aria-hidden style={[styles.focusRing, { borderRadius: radius + FOCUS_RING_GAP }]} />
        )}
      </Animated.View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: RING_WIDTH,
    // A faint light pooled just above center; nothing glows outside the circle.
    backgroundImage: `radial-gradient(circle at 50% 40%, ${ink(0.07)} 0%, ${ink(0.015)} 70%)`,
  },
  count: {
    color: colors.ink,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    includeFontPadding: false,
  },
  focusRing: {
    position: 'absolute',
    top: -FOCUS_RING_GAP,
    right: -FOCUS_RING_GAP,
    bottom: -FOCUS_RING_GAP,
    left: -FOCUS_RING_GAP,
    borderWidth: 2,
    borderColor: colors.inkMuted,
  },
})
