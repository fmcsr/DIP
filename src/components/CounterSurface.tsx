import { useId, type KeyboardEvent } from 'react'

/** Share of the viewport width the number may take; the rest is side margin. */
const COUNT_WIDTH_VW = 84
/** Advance width of one tabular digit in em, rounded up from common system fonts. */
const DIGIT_WIDTH_EM = 0.62
/** Height cap that keeps the number calm on landscape and desktop screens. */
const COUNT_MAX_HEIGHT_DVH = 42

// Shrinks with the digit count so long numbers never overflow. Sized for at least two digits
// so the number doesn't jump when going from 9 to 10.
function countFontSize(count: number): string {
  const digits = Math.max(String(count).length, 2)
  const widthVw = COUNT_WIDTH_VW / (digits * DIGIT_WIDTH_EM)
  return `min(${widthVw.toFixed(2)}vw, ${COUNT_MAX_HEIGHT_DVH}dvh)`
}

// A held Enter key fires a click on every key repeat; one press should count once.
function ignoreRepeatedEnter(event: KeyboardEvent<HTMLButtonElement>) {
  if (event.key === 'Enter' && event.repeat) event.preventDefault()
}

type CounterSurfaceProps = {
  count: number
  onIncrement: () => void
}

export function CounterSurface({ count, onIncrement }: CounterSurfaceProps) {
  const countId = useId()

  return (
    <>
      {/* One native button covers the screen, so taps, hardware keyboards and screen readers share a single path. */}
      <button
        type="button"
        aria-label="Sayacı artır"
        aria-describedby={countId}
        onClick={onIncrement}
        onKeyDown={ignoreRepeatedEnter}
        className="absolute inset-0 touch-manipulation select-none rounded-4xl [-webkit-touch-callout:none] focus-visible:outline-2 focus-visible:-outline-offset-8 focus-visible:outline-ink-muted"
      />

      <div className="pointer-events-none absolute inset-0 grid select-none place-items-center">
        <p
          id={countId}
          role="status"
          className="font-extralight leading-none tracking-tight whitespace-nowrap tabular-nums [text-box:trim-both_cap_alphabetic]"
          style={{ fontSize: countFontSize(count) }}
        >
          {count}
        </p>
      </div>

      <p
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] text-center text-sm tracking-wide text-ink-muted transition-opacity duration-700 motion-reduce:transition-none ${count === 0 ? 'opacity-100' : 'opacity-0'}`}
      >
        Saymak için dokun
      </p>
    </>
  )
}
