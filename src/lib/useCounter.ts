import { useCallback, useRef, useState } from 'react'
import {
  addRecentTarget,
  countTap,
  type CounterSettings,
  DEFAULT_COUNTER_SETTINGS,
  initialCounter,
  restartRound,
  startCount,
} from './counter'

/** The count, its rounds and settings, the recently set targets, and the actions that change them. */
export function useCounter() {
  const [settings, setSettings] = useState(DEFAULT_COUNTER_SETTINGS)
  const [counter, setCounter] = useState(() => initialCounter(DEFAULT_COUNTER_SETTINGS))
  // Most recent first; the target menu offers these.
  const [recentTargets, setRecentTargets] = useState<number[]>([])
  // Latest values, so taps landing between two renders never read a stale count.
  const latest = useRef({ settings, counter })

  /** Counts one tap and tells whether it completed a round. */
  const tap = useCallback((): boolean => {
    const { state, completedRound } = countTap(latest.current.counter, latest.current.settings)
    latest.current = { ...latest.current, counter: state }
    setCounter(state)
    return completedRound
  }, [])

  const configure = useCallback((next: CounterSettings) => {
    const restarted = restartRound(latest.current.counter, next)
    latest.current = { settings: next, counter: restarted }
    setSettings(next)
    setCounter(restarted)
  }, [])

  const reset = useCallback(() => {
    const fresh = initialCounter(latest.current.settings)
    latest.current = { ...latest.current, counter: fresh }
    setCounter(fresh)
  }, [])

  /** Records a target the person set, so the target menu offers it again. */
  const rememberTarget = useCallback((target: number) => {
    setRecentTargets((recent) => addRecentTarget(recent, target))
  }, [])

  return {
    settings,
    count: counter.count,
    rounds: counter.rounds,
    recentTargets,
    /** Nothing counted since the start or the last reset. */
    untouched: counter.rounds === 0 && counter.count === startCount(settings),
    tap,
    configure,
    reset,
    rememberTarget,
  }
}
