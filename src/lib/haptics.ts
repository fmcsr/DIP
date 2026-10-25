import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

/**
 * Light haptic tick for a counted tap: the lightest Taptic Engine impact on iOS, the system
 * key-press haptic on Android (Expo recommends it over driving the vibration motor directly).
 */
export function vibrateTap(): void {
  const tick =
    Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

  // A missing tick is harmless; it must never interrupt counting.
  tick.catch(() => {})
}
