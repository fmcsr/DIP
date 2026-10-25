import { Haptics, ImpactStyle } from '@capacitor/haptics'

/**
 * Light haptic tick for a counted tap: the lightest Taptic Engine impact on iOS,
 * a short low-amplitude vibration on Android.
 */
export function vibrateTap(): void {
  // A missing tick is harmless; it must never interrupt counting.
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
}
