import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

/** Follows the system "Reduce Motion" setting, so animations can be skipped while it is on. */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    let active = true
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled)
    })
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)

    return () => {
      active = false
      subscription.remove()
    }
  }, [])

  return reduceMotion
}
