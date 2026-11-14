import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { colors } from '@/constants/theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export function Header({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.linkText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && onPress ? styles.cardPressed : null,
        style,
      ]}>
      {children}
    </Pressable>
  );
}

export function IconBox({
  name,
  color,
  size = 48,
}: {
  name: IconName;
  color: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.iconBox,
        {
          width: size,
          height: size,
          borderRadius: size * 0.36,
          backgroundColor: color + '1F',
        },
      ]}>
      <MaterialIcons name={name} size={size * 0.5} color={color} />
    </View>
  );
}

export function Pill({ text, color }: { text: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '1A' }]}>
      <Text style={[styles.pillText, { color }]}>{text}</Text>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  icon,
  color = colors.accent,
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryWrap,
        { opacity: pressed ? 0.88 : 1 },
        style,
      ]}>
      <LinearGradient
        colors={[color, color + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primaryButton}>
        {icon ? <MaterialIcons name={icon} size={20} color={colors.bg} /> : null}
        <Text style={styles.primaryButtonText}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function RoundButton({
  icon,
  onPress,
  color = colors.accent,
  iconColor = colors.bg,
}: {
  icon: IconName;
  onPress: () => void;
  color?: string;
  iconColor?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.roundButton,
        { backgroundColor: color, opacity: pressed ? 0.8 : 1 },
      ]}>
      <MaterialIcons name={icon} size={24} color={iconColor} />
    </Pressable>
  );
}

export function GhostButton({
  title,
  onPress,
  color = colors.muted,
}: {
  title: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.ghostButton} hitSlop={6}>
      <Text style={[styles.ghostButtonText, { color }]}>{title}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={String(opt.key)}
            onPress={() => onChange(opt.key)}
            style={[styles.segment, active ? styles.segmentActive : null]}>
            <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.dim}
        style={[styles.input, props.multiline ? styles.inputMultiline : null]}
        {...props}
      />
    </View>
  );
}

export function EmptyState({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name={icon} size={30} color={colors.muted} />
      </View>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
  },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: 4 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  linkText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 16,
  },
  cardPressed: { backgroundColor: colors.surface2 },
  iconBox: { alignItems: 'center', justifyContent: 'center' },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pillText: { fontSize: 12, fontWeight: '700' },
  primaryWrap: { borderRadius: 18, overflow: 'hidden' },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  primaryButtonText: { color: colors.bg, fontSize: 16, fontWeight: '800' },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButton: { paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center' },
  ghostButtonText: { fontSize: 14, fontWeight: '700' },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  segmentTextActive: { color: colors.text },
  fieldLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 36 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
});
