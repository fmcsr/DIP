import { StatusBar } from 'expo-status-bar'
import { type ReactNode, useState } from 'react'
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { CounterSettings, Direction } from '../lib/counter'
import { type AccentId, type ColorMode, rgba, useTheme } from '../theme'
import { ColorSelect } from './ColorSelect'
import { TAP_EFFECT_OPTIONS, type TapEffect } from './effects/catalog'
import { Select, type SelectOption } from './Select'

// Only cards and what sits below them animate their layout. Rows inside a card take their new
// place at once and the clipping card grows over them, so an opened list unrolls instead of
// sliding under the rows.
const CARD_LAYOUT = LinearTransition.duration(220)

/** Digits the custom target field takes, so targets go up to 99,999. */
const TARGET_MAX_DIGITS = 5

// Up to iOS 18 an iPhone sheet sits on a black backdrop, so the status bar needs light content
// whatever the mode. From iOS 26 the counter page stays behind the sheet, only dimmed, and the
// app's own status bar already suits it.
const SHEET_ON_BLACK =
  Platform.OS === 'ios' && !Platform.isPad && Number.parseInt(String(Platform.Version), 10) < 26

type TargetChoice = number | 'off' | 'custom'

/** Off, the targets the person set lately, and Custom for a new one. */
function targetOptions(recentTargets: readonly number[]): SelectOption<TargetChoice>[] {
  return [
    { value: 'off', label: 'Off' },
    ...recentTargets.map((target) => ({ value: target, label: String(target) })),
    { value: 'custom', label: 'Custom' },
  ]
}

const DIRECTION_OPTIONS: SelectOption<Direction>[] = [
  { value: 'up', label: 'Count up' },
  { value: 'down', label: 'Count down' },
]

const MODE_OPTIONS: SelectOption<ColorMode>[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
]

type OpenSelect = 'target' | 'direction' | 'color' | 'mode' | 'effect' | null

function counterNote({ target, direction }: CounterSettings): string {
  if (target === null) return 'Counts on without rounds.'
  return direction === 'down'
    ? `Counts down from ${target}; a round completes at 0.`
    : `A round completes at ${target}, then the count starts again at 0.`
}

type SettingsSheetProps = {
  visible: boolean
  onClose: () => void
  counterSettings: CounterSettings
  onCounterSettingsChange: (settings: CounterSettings) => void
  /** Targets the person set lately, most recent first. */
  recentTargets: readonly number[]
  onRememberTarget: (target: number) => void
  onReset: () => void
  accent: AccentId
  onAccentChange: (accent: AccentId) => void
  mode: ColorMode
  onModeChange: (mode: ColorMode) => void
  effect: TapEffect
  onEffectChange: (effect: TapEffect) => void
}

/** The one other page: counter and appearance settings, each a drop-down in a calm column. */
export function SettingsSheet({
  visible,
  onClose,
  counterSettings,
  onCounterSettingsChange,
  recentTargets,
  onRememberTarget,
  onReset,
  accent,
  onAccentChange,
  mode,
  onModeChange,
  effect,
  onEffectChange,
}: SettingsSheetProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [openSelect, setOpenSelect] = useState<OpenSelect>(null)
  // Digits typed into the custom target field; null while the field is closed.
  const [customText, setCustomText] = useState<string | null>(null)

  const { target } = counterSettings
  const targetChoice: TargetChoice = customText !== null ? 'custom' : (target ?? 'off')
  const ink = rgba(theme.ink, 1)

  // Off and a typed 0 both count on without a target. Picking the current target again changes
  // nothing, so it never restarts the round.
  const applyTarget = (next: number | null) => {
    if (next === target) return
    onCounterSettingsChange(
      next === null ? { target: null, direction: 'up' } : { ...counterSettings, target: next },
    )
  }

  // Each keystroke applies the typed target at once, but it joins the recent targets only when
  // the person moves on (the field loses focus, the target menu opens or the page closes), so the
  // numbers typed on the way don't.
  const settleCustomTarget = () => {
    if (customText === null) return
    setCustomText(null)
    if (target !== null) onRememberTarget(target)
  }

  const toggle = (name: Exclude<OpenSelect, null>) => {
    if (name === 'target') settleCustomTarget()
    setOpenSelect((current) => (current === name ? null : name))
  }

  const chooseTarget = (choice: TargetChoice) => {
    setOpenSelect(null)
    if (choice === 'custom') {
      setCustomText('')
      return
    }
    applyTarget(choice === 'off' ? null : choice)
    if (choice !== 'off') onRememberTarget(choice)
  }

  const changeCustomText = (text: string) => {
    const digits = text.replace(/\D/g, '')
    setCustomText(digits)
    // A blank field keeps the target. 0 is how some people say "no target", so it means Off
    // rather than an error.
    if (digits !== '') applyTarget(Number(digits) || null)
  }

  const close = () => {
    settleCustomTarget()
    setOpenSelect(null)
    onClose()
  }

  const confirmReset = () => {
    Alert.alert('Reset count?', 'The count goes back to the start and your rounds are cleared.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: onReset },
    ])
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      {/* Mounted only while the sheet is open, this overrides the app's own status bar. */}
      {SHEET_ON_BLACK && <StatusBar style="light" animated />}
      <View
        style={[
          styles.sheet,
          // iOS shows this as a card below the status bar; Android draws it edge to edge. In
          // landscape the sides keep clear of the camera housing.
          {
            backgroundColor: theme.sheet,
            paddingTop: Platform.OS === 'android' ? insets.top : 0,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <View style={styles.header}>
          <Text role="heading" style={[styles.title, { color: ink }]}>
            Settings
          </Text>
          <Pressable
            role="button"
            hitSlop={8}
            onPress={close}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={[styles.done, { color: ink }]}>Done</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <Section title="Counter" note={counterNote(counterSettings)}>
            <Select
              label="Target"
              value={targetChoice}
              options={targetOptions(recentTargets)}
              open={openSelect === 'target'}
              onToggle={() => toggle('target')}
              onChange={chooseTarget}
            />
            {customText !== null && (
              <View style={styles.inputRow}>
                <Text style={[styles.label, { color: ink }]}>Custom target</Text>
                <TextInput
                  aria-label="Custom target"
                  value={customText}
                  onChangeText={changeCustomText}
                  onEndEditing={settleCustomTarget}
                  keyboardType="number-pad"
                  keyboardAppearance={theme.mode}
                  maxLength={TARGET_MAX_DIGITS}
                  autoFocus
                  style={[styles.input, { color: ink, borderColor: rgba(theme.ink, 0.16) }]}
                />
              </View>
            )}
            {target !== null && (
              <>
                <Separator />
                <Select
                  label="Direction"
                  value={counterSettings.direction}
                  options={DIRECTION_OPTIONS}
                  open={openSelect === 'direction'}
                  onToggle={() => toggle('direction')}
                  onChange={(direction) => {
                    setOpenSelect(null)
                    if (direction !== counterSettings.direction) {
                      onCounterSettingsChange({ ...counterSettings, direction })
                    }
                  }}
                />
              </>
            )}
            <Separator />
            <Pressable
              role="button"
              onPress={confirmReset}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: rgba(theme.ink, 0.05) },
              ]}
            >
              <Text style={[styles.label, { color: theme.danger }]}>Reset count</Text>
            </Pressable>
          </Section>

          <Section title="Appearance">
            <ColorSelect
              label="Color"
              value={accent}
              open={openSelect === 'color'}
              onToggle={() => toggle('color')}
              onChange={onAccentChange}
            />
            <Separator />
            <Select
              label="Mode"
              value={mode}
              options={MODE_OPTIONS}
              open={openSelect === 'mode'}
              onToggle={() => toggle('mode')}
              onChange={(next) => {
                setOpenSelect(null)
                onModeChange(next)
              }}
            />
            <Separator />
            <Select
              label="Tap effect"
              value={effect}
              options={TAP_EFFECT_OPTIONS}
              open={openSelect === 'effect'}
              onToggle={() => toggle('effect')}
              onChange={(next) => {
                setOpenSelect(null)
                onEffectChange(next)
              }}
            />
          </Section>
        </ScrollView>
      </View>
    </Modal>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  const theme = useTheme()

  return (
    <Animated.View layout={CARD_LAYOUT} style={styles.section}>
      <Text role="heading" style={[styles.sectionTitle, { color: theme.inkMuted }]}>
        {title}
      </Text>
      <Animated.View
        layout={CARD_LAYOUT}
        style={[
          styles.card,
          { backgroundColor: rgba(theme.ink, 0.035), borderColor: rgba(theme.ink, 0.07) },
        ]}
      >
        {children}
      </Animated.View>
      {note && (
        <Animated.Text layout={CARD_LAYOUT} style={[styles.note, { color: theme.inkMuted }]}>
          {note}
        </Animated.Text>
      )}
    </Animated.View>
  )
}

function Separator() {
  const theme = useTheme()
  return <View style={[styles.separator, { backgroundColor: rgba(theme.ink, 0.08) }]} />
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -0.3,
  },
  done: {
    fontSize: 17,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.5,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    letterSpacing: 0.4,
    marginBottom: 8,
    marginLeft: 20,
  },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    marginHorizontal: 20,
  },
  row: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
  },
  inputRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
  },
  input: {
    minWidth: 96,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 20,
  },
})
