import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

/**
 * Light haptic tick for a counted tap: the lightest Taptic Engine impact on iOS, the system
 * key-press haptic on Android (Expo recommends it over driving the vibration motor directly).
 */
export function vibrateTap(): void {
  play(
    Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  )
}

/** A distinct, affirming pattern when a round is complete. */
export function vibrateRound(): void {
  play(
    Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  )
}

/** Firmer tick when the counter is picked up to be moved. */
export function vibratePickup(): void {
  play(
    Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Long_Press)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  )
}

// A missing tick is harmless; it must never interrupt counting.
function play(tick: Promise<void>): void {
  tick.catch(() => {})
}
