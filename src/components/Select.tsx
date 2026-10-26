import Feather from '@expo/vector-icons/Feather'
import type { ReactNode } from 'react'
import { Pressable, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { rgba, useTheme } from '../theme'

export type SelectOption<T> = { value: T; label: string }

type SelectRowProps = {
  label: string
  /** The current value as screen readers hear it. */
  valueLabel: string
  open: boolean
  onToggle: () => void
  /** The current value as shown, left of the chevron. */
  children: ReactNode
}

/** The part of a drop-down that is always visible: its label, current value and a chevron. */
export function SelectRow({ label, valueLabel, open, onToggle, children }: SelectRowProps) {
  const theme = useTheme()

  return (
    <Pressable
      role="button"
      aria-expanded={open}
      aria-label={`${label}, ${valueLabel}`}
      onPress={onToggle}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: rgba(theme.ink, 0.05) }]}
    >
      <Text style={[styles.label, { color: rgba(theme.ink, 1) }]}>{label}</Text>
      <View style={styles.current}>
        {children}
        <Feather
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.inkMuted}
          aria-hidden
        />
      </View>
    </Pressable>
  )
}

type SelectPanelProps = {
  label: string
  style?: StyleProp<ViewStyle>
  children: ReactNode
}

/**
 * The opened part of a drop-down, a radio group for screen readers. It has no exit animation:
 * fading out, the options would linger over the rows that move up into their place.
 */
export function SelectPanel({ label, style, children }: SelectPanelProps) {
  const theme = useTheme()

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      role="radiogroup"
      aria-label={label}
      style={[styles.panel, { backgroundColor: rgba(theme.ink, 0.04) }, style]}
    >
      {children}
    </Animated.View>
  )
}

type SelectProps<T> = {
  label: string
  value: T
  options: readonly SelectOption<T>[]
  open: boolean
  onToggle: () => void
  onChange: (value: T) => void
}

/** A settings row that drops down its options in place, so the sheet keeps one calm column. */
export function Select<T extends string | number>({
  label,
  value,
  options,
  open,
  onToggle,
  onChange,
}: SelectProps<T>) {
  const theme = useTheme()
  const selected = options.find((option) => option.value === value)

  return (
    <View>
      <SelectRow label={label} valueLabel={selected?.label ?? ''} open={open} onToggle={onToggle}>
        <Text style={[styles.value, { color: theme.inkMuted }]}>{selected?.label}</Text>
      </SelectRow>

      {open && (
        <SelectPanel label={label}>
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <Pressable
                key={String(option.value)}
                role="radio"
                aria-checked={isSelected}
                aria-label={option.label}
                onPress={() => onChange(option.value)}
                style={({ pressed }) => [
                  styles.option,
                  pressed && { backgroundColor: rgba(theme.ink, 0.06) },
                ]}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    { color: isSelected ? rgba(theme.ink, 1) : theme.inkMuted },
                  ]}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <Feather name="check" size={18} color={rgba(theme.accent, 1)} aria-hidden />
                )}
              </Pressable>
            )
          })}
        </SelectPanel>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
  },
  label: {
    fontSize: 16,
  },
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    fontSize: 16,
  },
  panel: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 14,
    paddingVertical: 4,
  },
  option: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  optionLabel: {
    fontSize: 15,
  },
})
