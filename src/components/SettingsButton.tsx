import Feather from '@expo/vector-icons/Feather'
import { Pressable, type StyleProp, StyleSheet, type ViewStyle } from 'react-native'
import { useTheme } from '../theme'

type SettingsButtonProps = {
  onPress: () => void
  style?: StyleProp<ViewStyle>
}

/** A quiet gear in the top-right corner, out of the way of the thumb that counts. */
export function SettingsButton({ onPress, style }: SettingsButtonProps) {
  const theme = useTheme()

  return (
    <Pressable
      role="button"
      aria-label="Settings"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, style, pressed && styles.pressed]}
    >
      <Feather name="settings" size={22} color={theme.inkMuted} aria-hidden />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.5,
  },
})
