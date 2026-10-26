import { createContext, useContext } from 'react'

export type Rgb = readonly [number, number, number]

export type ColorMode = 'dark' | 'light'

export type Theme = {
  mode: ColorMode
  /** Screen background, faintly tinted with the chosen color. */
  surface: string
  /** Settings sheet background, a step above the screen. */
  sheet: string
  /** The number and primary text. */
  ink: Rgb
  /** Hints and secondary text; at least 4.5:1 against both backgrounds. */
  inkMuted: string
  /** The chosen color: the circle's edge, tap effects and selection marks. */
  accent: Rgb
  /** Light pooled inside the circle. */
  glow: string
  danger: string
  statusBar: 'light' | 'dark'
}

/** An RGB color at the given opacity; also usable inside animation worklets. */
export function rgba([r, g, b]: Rgb, alpha: number): string {
  'worklet'
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** The color `amount` of the way from `from` to `to`. */
export function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  return [
    Math.round(from[0] + (to[0] - from[0]) * amount),
    Math.round(from[1] + (to[1] - from[1]) * amount),
    Math.round(from[2] + (to[2] - from[2]) * amount),
  ]
}

// How far from gray a color's tint may reach; neon colors go well past it, softer ones stay below.
const MAX_TINT_SPREAD = 80

/**
 * Leans `base` toward the hue of `color` without changing how light it is: only what sets the
 * color apart from gray is added, so neutral colors leave the base as it is. That difference is
 * capped, so neon colors tint the backgrounds as faintly as the softer ones.
 */
function tinted(base: Rgb, color: Rgb, amount: number): Rgb {
  const gray = (color[0] + color[1] + color[2]) / 3
  const spread = Math.max(...color.map((value) => Math.abs(value - gray)))
  const strength = amount * Math.min(1, MAX_TINT_SPREAD / spread)
  const channel = (index: 0 | 1 | 2) =>
    Math.min(Math.max(Math.round(base[index] + (color[index] - gray) * strength), 0), 255)
  return [channel(0), channel(1), channel(2)]
}

export const WHITE: Rgb = [255, 255, 255]
export const BLACK: Rgb = [0, 0, 0]

function hex(value: string): Rgb {
  const n = Number.parseInt(value.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Every color has a luminous shade for dark mode and a deeper one that keeps its contrast on the
// light background, so a color reads as the same color in both modes. The top row is neon on
// dark; on light it takes the same hues, deepened to about 4.5:1 against the background.
const COLOR_ROWS = [
  [
    { id: 'mono', name: 'Mono', dark: '#e8e8ee', light: '#3c3c43' },
    { id: 'pink', name: 'Pink', dark: '#ff2e88', light: '#d9046e' },
    { id: 'orange', name: 'Orange', dark: '#ff6a2b', light: '#c34501' },
    { id: 'yellow', name: 'Yellow', dark: '#ffd21f', light: '#866d03' },
    { id: 'lime', name: 'Lime', dark: '#b5ff2b', light: '#547b00' },
    { id: 'green', name: 'Green', dark: '#2bff88', light: '#068140' },
    { id: 'aqua', name: 'Aqua', dark: '#1ff2d6', light: '#057d6e' },
    { id: 'cyan', name: 'Cyan', dark: '#22d3ff', light: '#027995' },
    { id: 'blue', name: 'Blue', dark: '#4d8dff', light: '#0264fa' },
    { id: 'indigo', name: 'Indigo', dark: '#7b6cff', light: '#6d4ffe' },
    { id: 'purple', name: 'Purple', dark: '#b45cff', light: '#a61afe' },
    { id: 'magenta', name: 'Magenta', dark: '#ff44ee', light: '#c801bb' },
  ],
  [
    { id: 'sand', name: 'Sand', dark: '#dccab0', light: '#8b7354' },
    { id: 'blush', name: 'Blush', dark: '#e6b7c1', light: '#a8606f' },
    { id: 'clay', name: 'Clay', dark: '#e4b3a0', light: '#a96249' },
    { id: 'honey', name: 'Honey', dark: '#e8cc98', light: '#977433' },
    { id: 'olive', name: 'Olive', dark: '#cdd2a1', light: '#737a3f' },
    { id: 'sage', name: 'Sage', dark: '#b1cfb6', light: '#5a8062' },
    { id: 'seafoam', name: 'Seafoam', dark: '#a8d4ce', light: '#4b827c' },
    { id: 'mist', name: 'Mist', dark: '#b1cbde', light: '#52748d' },
    { id: 'denim', name: 'Denim', dark: '#b3c0e0', light: '#566797' },
    { id: 'dusk', name: 'Dusk', dark: '#bcb8e2', light: '#645e9a' },
    { id: 'lavender', name: 'Lavender', dark: '#cfbce5', light: '#79649b' },
    { id: 'mauve', name: 'Mauve', dark: '#dfb8d9', light: '#8f6089' },
  ],
] as const

export type AccentId = (typeof COLOR_ROWS)[number][number]['id']

export type Accent = {
  id: AccentId
  name: string
  /** Hue family: the same column in both rows. */
  column: number
  dark: Rgb
  light: Rgb
}

/** The picker's grid: neon colors above, softer ones below, one hue family per column. */
export const ACCENT_ROWS: readonly (readonly Accent[])[] = COLOR_ROWS.map((row) =>
  row.map(({ id, name, dark, light }, column) => ({
    id,
    name,
    column,
    dark: hex(dark),
    light: hex(light),
  })),
)

/**
 * The columns a narrow picker keeps, most wanted first: the neutrals, then hues spread evenly
 * around the color wheel, so any number of columns still covers it.
 */
export const ACCENT_COLUMN_PRIORITY: readonly number[] = [0, 3, 7, 1, 5, 10, 6, 2, 9, 11, 4, 8]

const ACCENTS = Object.fromEntries(
  ACCENT_ROWS.flat().map((accent) => [accent.id, accent]),
) as Record<AccentId, Accent>

export function accentById(id: AccentId): Accent {
  return ACCENTS[id]
}

/** The shade of a color used in the given mode. */
export function accentShade(accent: Accent, mode: ColorMode): Rgb {
  return mode === 'dark' ? accent.dark : accent.light
}

type Base = {
  surface: Rgb
  sheet: Rgb
  ink: Rgb
  inkMuted: string
  danger: string
  statusBar: 'light' | 'dark'
  /** How strongly the chosen color tints the backgrounds. */
  tint: number
}

// Light mode mirrors dark mode: only the backgrounds and text swap, the layout and color stay.
const BASES: Record<ColorMode, Base> = {
  dark: {
    surface: hex('#0a0a0c'),
    sheet: hex('#141418'),
    ink: [236, 236, 240],
    inkMuted: '#8c8c96',
    danger: '#ff7b72',
    statusBar: 'light',
    tint: 0.12,
  },
  light: {
    surface: hex('#f5f3ef'),
    sheet: hex('#fbfaf8'),
    ink: [30, 29, 33],
    inkMuted: '#65615c',
    danger: '#c4372d',
    statusBar: 'dark',
    tint: 0.15,
  },
}

/** The whole look for a mode and a chosen color. */
export function buildTheme(mode: ColorMode, accentId: AccentId): Theme {
  const base = BASES[mode]
  const accent = accentById(accentId)
  // The luminous shade carries the clearest hue, so it tints both modes.
  const tint = accent.dark
  return {
    mode,
    surface: rgba(tinted(base.surface, tint, base.tint), 1),
    sheet: rgba(tinted(base.sheet, tint, base.tint * 0.7), 1),
    ink: base.ink,
    inkMuted: base.inkMuted,
    accent: accentShade(accent, mode),
    glow: mode === 'dark' ? innerGlow(tint, 0.08, 0.016) : innerGlow(WHITE, 0.6, 0.14),
    danger: base.danger,
    statusBar: base.statusBar,
  }
}

function innerGlow(color: Rgb, center: number, edge: number): string {
  return `radial-gradient(circle at 50% 40%, ${rgba(color, center)} 0%, ${rgba(color, edge)} 70%)`
}

const ThemeContext = createContext<Theme>(buildTheme('dark', 'mono'))

export const ThemeProvider = ThemeContext.Provider

export function useTheme(): Theme {
  return useContext(ThemeContext)
}
