import { useEffect, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useAnimatedValue,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useReduceMotion } from '../lib/useReduceMotion'
import { colors } from '../theme'

/** Share of the screen width the number may take; the rest is side margin. */
const COUNT_WIDTH_RATIO = 0.84
/** Advance width of one tabular digit in em, rounded up from common system fonts. */
const DIGIT_WIDTH_EM = 0.62
/** Height cap that keeps the number calm on landscape and tablet screens. */
const COUNT_MAX_HEIGHT_RATIO = 0.42
/** Fade-out of the "tap to count" hint once counting starts. */
const HINT_FADE_MS = 700

// Shrinks with the digit count so long numbers never overflow. Sized for at least two digits
// so the number doesn't jump when going from 9 to 10.
function countFontSize(count: number, width: number, height: number): number {
  const digits = Math.max(String(count).length, 2)
  return Math.min(
    (width * COUNT_WIDTH_RATIO) / (digits * DIGIT_WIDTH_EM),
    height * COUNT_MAX_HEIGHT_RATIO,
  )
}

type CounterSurfaceProps = {
  count: number
  onIncrement: () => void
}

export function CounterSurface({ count, onIncrement }: CounterSurfaceProps) {
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const reduceMotion = useReduceMotion()
  const [keyboardFocused, setKeyboardFocused] = useState(false)
  const fontSize = countFontSize(count, width, height)

  const showHint = count === 0
  const hintOpacity = useAnimatedValue(showHint ? 1 : 0)

  useEffect(() => {
    const toValue = showHint ? 1 : 0
    if (reduceMotion) {
      hintOpacity.setValue(toValue)
      return
    }
    const fade = Animated.timing(hintOpacity, {
      toValue,
      duration: HINT_FADE_MS,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    })
    fade.start()
    return () => fade.stop()
  }, [showHint, reduceMotion, hintOpacity])

  // Screen readers hear every new value, like a live region; the starting 0 is not announced.
  const announcedCount = useRef(count)
  useEffect(() => {
    if (count === announcedCount.current) return
    announcedCount.current = count
    AccessibilityInfo.announceForAccessibility(String(count))
  }, [count])

  return (
    // One full-screen button, so taps, hardware keyboards and screen readers share a single path.
    // Everything drawn on the surface is its child, so a touch anywhere bubbles up to it.
    <Pressable
      role="button"
      aria-label="Sayacı artır"
      aria-valuetext={String(count)}
      onPress={onIncrement}
      onFocus={() => setKeyboardFocused(true)}
      onBlur={() => setKeyboardFocused(false)}
      style={styles.surface}
    >
      {/* Visual only: the button carries the value for screen readers. */}
      <Text
        aria-hidden
        allowFontScaling={false}
        numberOfLines={1}
        style={[styles.count, { fontSize, letterSpacing: fontSize * -0.025 }]}
      >
        {count}
      </Text>

      <Animated.View
        aria-hidden
        style={[styles.hint, { paddingBottom: insets.bottom + 40, opacity: hintOpacity }]}
      >
        <Text style={styles.hintText}>Saymak için dokun</Text>
      </Animated.View>

      {keyboardFocused && <View aria-hidden style={styles.focusRing} />}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  surface: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  count: {
    color: colors.ink,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    includeFontPadding: false,
  },
  hint: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 24,
  },
  hintText: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.35,
    textAlign: 'center',
  },
  // Shown while a hardware keyboard focuses the surface on Android; iOS Full Keyboard Access
  // draws its own system focus ring.
  focusRing: {
    position: 'absolute',
    top: 8,
    right: 8,
    bottom: 8,
    left: 8,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.inkMuted,
  },
})
