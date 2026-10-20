import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { FlowHeader } from '@/components/Legacy';

/** 화면 위·아래 여백 — useLegacyPad와 같은 값 (기기 안전 영역) */
export function useScreenPad() {
  const insets = useSafeAreaInsets();
  return { top: insets.top, bottom: insets.bottom };
}

/** 보조 화면 머리 — 수정 전 흐름 화면 머리(FlowHeader)와 같은 모양 */
export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title?: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  return <FlowHeader title={title} onBack={onBack} right={right} />;
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
