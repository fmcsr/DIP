export const colors = {
  surface: '#0a0a0c',
  ink: '#ececf1',
  inkMuted: '#8b8b94',
} as const

/** The ink color at the given opacity; also usable inside animation worklets. */
export function ink(alpha: number): string {
  'worklet'
  return `rgba(236, 236, 241, ${alpha})`
}
