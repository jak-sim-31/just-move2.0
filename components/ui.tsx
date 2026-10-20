import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

/** 화면 위·아래 여백 (웹은 노치가 없으므로 고정값) */
export function useScreenPad() {
  const insets = useSafeAreaInsets();
  return {
    top: Platform.OS === 'web' ? 16 : insets.top,
    bottom: Platform.OS === 'web' ? 16 : insets.bottom,
  };
}

export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const colors = useColors();
  const pad = useScreenPad();
  return (
    <View style={[styles.header, { paddingTop: pad.top + 8 }]}>
      <View style={styles.headerSide}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="뒤로"
            style={styles.iconBtn}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={26} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
      <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
        {title ?? ''}
      </Text>
      <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

type Variant = 'primary' | 'outline' | 'ghost' | 'accent';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}) {
  const colors = useColors();
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'accent'
        ? colors.accent
        : 'transparent';
  const fg =
    variant === 'primary' || variant === 'accent' ? '#FFFFFF' : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: variant === 'outline' ? colors.primary : 'transparent',
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={20} color={fg} style={{ marginRight: 6 }} /> : null}
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  headerSide: { width: 72, justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  button: {
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: { fontSize: 17, fontWeight: '700' },
});
