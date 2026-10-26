import type { SelectOption } from '../Select'

export type TapEffect = 'water' | 'ripple' | 'zigzag' | 'stardust' | 'glow' | 'lotus' | 'none'

/** The tap effects in the order the settings list them. */
export const TAP_EFFECT_OPTIONS: SelectOption<TapEffect>[] = [
  { value: 'water', label: 'Water drop' },
  { value: 'ripple', label: 'Ripple' },
  { value: 'zigzag', label: 'Zigzag' },
  { value: 'stardust', label: 'Stardust' },
  { value: 'glow', label: 'Glow' },
  { value: 'lotus', label: 'Lotus' },
  { value: 'none', label: 'None' },
]
