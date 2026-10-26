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
import { rgba, useTheme } from '../theme'
import { type TapEffect, TapEffectView } from './effects'

/** Holding the circle this long picks it up to be moved instead of counting. */
const LONG_PRESS_MS = 450
/** Tap effects playing at once; when tapping very fast the oldest one is dropped. */
const MAX_EFFECTS = 12
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

/** One tap's effect, kept as chosen at the time of the tap. */
type EffectItem = { id: number; strong: boolean; effect: Exclude<TapEffect, 'none'> }

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
  rounds: number
  /** Count that completes a round; null hides the round label. */
  target: number | null
  effect: TapEffect
  diameter: number
  bounds: DragBounds
  /** Counts one tap and tells whether it completed a round. */
  onTap: () => boolean
}

/**
 * The counter: a circle that counts on a quick tap and plays the chosen tap effect. Holding it
 * picks it up, so it can be dragged anywhere on screen without counting.
 */
export function CounterCircle({
  count,
  rounds,
  target,
  effect,
  diameter,
  bounds,
  onTap,
}: CounterCircleProps) {
  const theme = useTheme()
  const radius = diameter / 2
  const offsetX = useSharedValue(0)
  const offsetY = useSharedValue(0)
  const dragOriginX = useSharedValue(0)
  const dragOriginY = useSharedValue(0)
  const limits = useSharedValue(bounds)
  const pressed = useSharedValue(0)
  const lifted = useSharedValue(0)
  // Played by tap effects that make the circle itself give under the tap.
  const circleScale = useSharedValue(1)
  const [effects, setEffects] = useState<EffectItem[]>([])
  const nextEffectId = useRef(0)
  const [keyboardFocused, setKeyboardFocused] = useState(false)

  // Keep the circle on screen when the available space changes, e.g. on rotation.
  useEffect(() => {
    limits.set(bounds)
    offsetX.set(clamp(offsetX.get(), bounds.minX, bounds.maxX))
    offsetY.set(clamp(offsetY.get(), bounds.minY, bounds.maxY))
  }, [bounds, limits, offsetX, offsetY])

  const handleTap = useCallback(() => {
    const completedRound = onTap()
    if (effect === 'none') return
    const item = { id: nextEffectId.current++, strong: completedRound, effect }
    setEffects((current) => [...current.slice(1 - MAX_EFFECTS), item])
  }, [effect, onTap])

  const removeEffect = useCallback((id: number) => {
    setEffects((current) => current.filter((item) => item.id !== id))
  }, [])

  // Screen readers hear every new value, like a live region, and when a round is complete.
  // The starting value is not announced.
  const announced = useRef({ count, rounds })
  useEffect(() => {
    const previous = announced.current
    if (previous.count === count && previous.rounds === rounds) return
    announced.current = { count, rounds }
    AccessibilityInfo.announceForAccessibility(
      rounds > previous.rounds ? `Round ${rounds} complete` : String(count),
    )
  }, [count, rounds])

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

  // Pressing sinks the circle slightly; picking it up lifts it and brightens its edge. Some tap
  // effects play its scale too.
  const accent = theme.accent
  const discStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale:
          (1 - 0.035 * pressed.get()) * (1 + 0.06 * lifted.get()) * circleScale.get(),
      },
    ],
    borderColor: rgba(accent, 0.28 + 0.32 * lifted.get()),
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
        aria-valuetext={target === null ? String(count) : `${count}, round ${rounds + 1}`}
        accessibilityActions={ACTIVATE_ACTION}
        onAccessibilityAction={handleAccessibilityAction}
        onClick={handleClick}
        onFocus={() => setKeyboardFocused(true)}
        onBlur={() => setKeyboardFocused(false)}
        style={[circleSize, positionStyle]}
      >
        {/* Behind the disc: what plays inside the circle shows through its glow. */}
        {effects.map((item) => (
          <TapEffectView
            key={item.id}
            effect={item.effect}
            id={item.id}
            diameter={diameter}
            strong={item.strong}
            circleScale={circleScale}
            onDone={removeEffect}
          />
        ))}

        <Animated.View
          style={[styles.disc, circleSize, { backgroundImage: theme.glow }, discStyle]}
        >
          {/* Visual only: the circle itself carries the value for screen readers. */}
          <Text
            aria-hidden
            allowFontScaling={false}
            numberOfLines={1}
            style={[
              styles.count,
              { color: rgba(theme.ink, 1), fontSize, letterSpacing: fontSize * -0.025 },
            ]}
          >
            {count}
          </Text>
          {target !== null && (
            <Text
              aria-hidden
              allowFontScaling={false}
              style={[
                styles.round,
                {
                  color: theme.inkMuted,
                  fontSize: Math.max(diameter * 0.058, 12),
                  bottom: diameter * 0.16,
                },
              ]}
            >
              Round {rounds + 1}
            </Text>
          )}
        </Animated.View>

        {/* Shown while a hardware keyboard focuses the circle on Android; iOS Full Keyboard
            Access draws its own system focus ring. */}
        {keyboardFocused && (
          <View
            aria-hidden
            style={[
              styles.focusRing,
              { borderRadius: radius + FOCUS_RING_GAP, borderColor: theme.inkMuted },
            ]}
          />
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
  },
  count: {
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    includeFontPadding: false,
  },
  round: {
    position: 'absolute',
    letterSpacing: 0.6,
    fontVariant: ['tabular-nums'],
  },
  focusRing: {
    position: 'absolute',
    top: -FOCUS_RING_GAP,
    right: -FOCUS_RING_GAP,
    bottom: -FOCUS_RING_GAP,
    left: -FOCUS_RING_GAP,
    borderWidth: 2,
  },
})
