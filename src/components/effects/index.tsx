import type { ComponentType } from 'react'
import type { TapEffect } from './catalog'
import type { TapEffectProps } from './clock'
import { Glow } from './Glow'
import { Lotus } from './Lotus'
import { Ripple } from './Ripple'
import { Stardust } from './Stardust'
import { Water } from './Water'
import { Zigzag } from './Zigzag'

export type { TapEffect } from './catalog'

const EFFECTS: Record<Exclude<TapEffect, 'none'>, ComponentType<TapEffectProps>> = {
  water: Water,
  ripple: Ripple,
  zigzag: Zigzag,
  stardust: Stardust,
  glow: Glow,
  lotus: Lotus,
}

type TapEffectViewProps = TapEffectProps & { effect: Exclude<TapEffect, 'none'> }

/** One play of a tap effect around the counter circle. */
export function TapEffectView({ effect, ...props }: TapEffectViewProps) {
  const Effect = EFFECTS[effect]
  return <Effect {...props} />
}
