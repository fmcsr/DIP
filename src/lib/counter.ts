export type Direction = 'up' | 'down'

export type CounterSettings = {
  /** Count that completes a round; null counts on without rounds. */
  target: number | null
  /** Counting down needs a target: a round starts there and ends at zero. */
  direction: Direction
}

export type CounterState = {
  count: number
  /** Completed rounds. */
  rounds: number
}

export const DEFAULT_COUNTER_SETTINGS: CounterSettings = { target: null, direction: 'up' }

/** Where a round starts: zero when counting up, the target when counting down. */
export function startCount({ target, direction }: CounterSettings): number {
  return direction === 'down' && target !== null ? target : 0
}

export function initialCounter(settings: CounterSettings): CounterState {
  return { count: startCount(settings), rounds: 0 }
}

/**
 * One counted tap. Counting up, reaching the target completes a round and starts again at zero;
 * counting down, reaching zero completes a round and starts again at the target.
 */
export function countTap(
  state: CounterState,
  { target, direction }: CounterSettings,
): { state: CounterState; completedRound: boolean } {
  if (target === null) {
    return { state: { ...state, count: state.count + 1 }, completedRound: false }
  }
  if (direction === 'down') {
    const next = state.count - 1
    return next <= 0
      ? { state: { count: target, rounds: state.rounds + 1 }, completedRound: true }
      : { state: { ...state, count: next }, completedRound: false }
  }
  const next = state.count + 1
  return next >= target
    ? { state: { count: 0, rounds: state.rounds + 1 }, completedRound: true }
    : { state: { ...state, count: next }, completedRound: false }
}

/** New target or direction: the current round starts over; changing settings never completes one. */
export function restartRound(state: CounterState, settings: CounterSettings): CounterState {
  return { count: startCount(settings), rounds: state.rounds }
}

/** How many of the person's own targets the target menu offers. */
export const RECENT_TARGETS_LIMIT = 3

/**
 * Puts a target first among the recently set ones, without duplicates. Past the limit, the one
 * set longest ago drops off.
 */
export function addRecentTarget(recent: readonly number[], target: number): number[] {
  return [target, ...recent.filter((value) => value !== target)].slice(0, RECENT_TARGETS_LIMIT)
}
