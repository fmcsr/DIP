import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  ACCENT_COLUMN_PRIORITY,
  ACCENT_ROWS,
  type AccentId,
  accentById,
  accentShade,
  rgba,
  useTheme,
} from '../theme'
import { SelectPanel, SelectRow } from './Select'

const SWATCH = 32
/** Touch target of a swatch; the ring marking the selected one fits inside it. */
const SWATCH_HIT = 44
const MIN_GAP = 6
const MAX_GAP = 20
/** The panel's inset from the card's edges, and its padding. */
const PANEL_MARGIN = 12
const PANEL_PADDING = 12
const MIN_COLUMNS = 4

/** The hue families shown in `count` columns, always including the selected one. */
function visibleColumns(count: number, selected: number): number[] {
  const columns = ACCENT_COLUMN_PRIORITY.slice(0, count)
  if (!columns.includes(selected)) columns[count - 1] = selected
  return columns.sort((a, b) => a - b)
}

type ColorSelectProps = {
  label: string
  value: AccentId
  open: boolean
  onToggle: () => void
  onChange: (id: AccentId) => void
}

/**
 * A drop-down of color swatches in two rows, neon above and soft below, with as many columns
 * as fit. It stays open after a pick, so colors can be tried one after another.
 */
export function ColorSelect({ label, value, open, onToggle, onChange }: ColorSelectProps) {
  const theme = useTheme()
  const [width, setWidth] = useState(0)
  const selected = accentById(value)

  const inner = width - 2 * (PANEL_MARGIN + PANEL_PADDING)
  const count = Math.min(
    Math.max(Math.floor((inner + MIN_GAP) / (SWATCH_HIT + MIN_GAP)), MIN_COLUMNS),
    ACCENT_ROWS[0].length,
  )
  const gap = Math.min((inner - count * SWATCH_HIT) / (count - 1), MAX_GAP)
  const columns = visibleColumns(count, selected.column)

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <SelectRow label={label} valueLabel={selected.name} open={open} onToggle={onToggle}>
        <View
          style={[styles.dot, { backgroundColor: rgba(accentShade(selected, theme.mode), 1) }]}
        />
        <Text style={[styles.value, { color: theme.inkMuted }]}>{selected.name}</Text>
      </SelectRow>

      {open && width > 0 && (
        <SelectPanel label={label} style={styles.panel}>
          {ACCENT_ROWS.map((row, rowIndex) => (
            <View key={rowIndex} style={[styles.swatchRow, { gap }]}>
              {columns.map((column) => {
                const accent = row[column]
                const color = rgba(accentShade(accent, theme.mode), 1)
                const isSelected = accent.id === value
                return (
                  <Pressable
                    key={accent.id}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={accent.name}
                    onPress={() => onChange(accent.id)}
                    style={({ pressed }) => [styles.swatchHit, pressed && styles.pressed]}
                  >
                    <View style={[styles.selectionRing, isSelected && { borderColor: color }]}>
                      <View
                        style={[
                          styles.swatch,
                          { backgroundColor: color, borderColor: rgba(theme.ink, 0.14) },
                        ]}
                      />
                    </View>
                  </Pressable>
                )
              })}
            </View>
          ))}
        </SelectPanel>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  value: {
    fontSize: 16,
  },
  panel: {
    paddingVertical: PANEL_PADDING - 2,
    paddingHorizontal: PANEL_PADDING,
    gap: 6,
  },
  swatchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  swatchHit: {
    width: SWATCH_HIT,
    height: SWATCH_HIT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  selectionRing: {
    width: SWATCH + 10,
    height: SWATCH + 10,
    borderRadius: (SWATCH + 10) / 2,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: SWATCH / 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
})
